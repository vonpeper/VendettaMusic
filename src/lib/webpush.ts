import { db } from "@/lib/db"
import crypto from "crypto"

// Real NIST P-256 VAPID Keys for Vendetta Music
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BNed5hz80wadrpiAoeOqHQ5SWOa5Fgw_OJepWU8zomvD9HLPObjZGM_oc4L219jhAicmbUiG4dgct3gRCm24R-U"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "oyo-u47ia_nWqZnHsibBZ9lmApR6Rg-bBOntPBCH54k"
const VAPID_SUBJECT = "mailto:contacto@vendetta.mx"

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: Record<string, unknown>
}

export interface WebSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Generates RFC 8292 ES256 VAPID Authorization header
 */
function getVapidAuthHeader(endpoint: string): Record<string, string> {
  try {
    const url = new URL(endpoint)
    const audience = `${url.protocol}//${url.host}`
    
    const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url")
    const claims = Buffer.from(JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: VAPID_SUBJECT
    })).toString("base64url")
    
    const unsignedToken = `${header}.${claims}`
    
    const jwk = {
      kty: "EC",
      crv: "P-256",
      x: Buffer.from(VAPID_PUBLIC_KEY, "base64url").slice(1, 33).toString("base64url"),
      y: Buffer.from(VAPID_PUBLIC_KEY, "base64url").slice(33, 65).toString("base64url"),
      d: VAPID_PRIVATE_KEY
    }
    
    const privateKey = crypto.createPrivateKey({ format: "jwk", key: jwk })
    
    const signer = crypto.createSign("SHA256")
    signer.update(unsignedToken)
    signer.end()
    
    const derSignature = signer.sign(privateKey)
    
    // Convert DER signature to 64-byte raw R+S format for JWT ES256
    let offset = 2
    if (derSignature[offset] & 0x80) offset += (derSignature[offset] & 0x7f) + 1
    offset++
    const rLen = derSignature[offset++]
    let r = derSignature.slice(offset, offset + rLen)
    offset += rLen
    offset++
    const sLen = derSignature[offset++]
    let s = derSignature.slice(offset, offset + sLen)
    
    while (r.length > 32) r = r.slice(1)
    while (s.length > 32) s = s.slice(1)
    while (r.length < 32) r = Buffer.concat([Buffer.from([0]), r])
    while (s.length < 32) s = Buffer.concat([Buffer.from([0]), s])
    
    const signature = Buffer.concat([r, s]).toString("base64url")
    const jwt = `${unsignedToken}.${signature}`
    
    return {
      Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`
    }
  } catch (vapidErr) {
    console.error("Error generating VAPID auth header:", vapidErr)
    return {}
  }
}

/**
 * Ensures table WebPushSubscription exists in SQLite.
 */
export async function ensureWebPushTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS WebPushSubscription (
        id TEXT PRIMARY KEY,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        userAgent TEXT,
        role TEXT DEFAULT 'musician',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
  } catch (err) {
    console.error("Error creating WebPushSubscription table:", err)
  }
}

/**
 * Saves a browser push subscription.
 */
export async function saveWebPushSubscription(sub: WebSubscription, userAgent?: string) {
  await ensureWebPushTable()
  const id = crypto.createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 32)

  try {
    await db.$executeRawUnsafe(
      `INSERT INTO WebPushSubscription (id, endpoint, p256dh, auth, userAgent, updatedAt) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(endpoint) DO UPDATE SET 
         p256dh = excluded.p256dh, 
         auth = excluded.auth, 
         userAgent = excluded.userAgent,
         updatedAt = CURRENT_TIMESTAMP`,
      id,
      sub.endpoint,
      sub.keys.p256dh,
      sub.keys.auth,
      userAgent || "Unknown"
    )
    return { success: true, id }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    console.error("Error saving web push subscription:", error)
    return { success: false, error: msg }
  }
}

/**
 * Removes an invalid / expired push subscription.
 */
export async function removeWebPushSubscription(endpoint: string) {
  try {
    await db.$executeRawUnsafe(`DELETE FROM WebPushSubscription WHERE endpoint = ?`, endpoint)
  } catch (err) {
    console.error("Error removing subscription:", err)
  }
}

/**
 * Gets all active web push subscriptions.
 */
export async function getWebPushSubscriptions(): Promise<Array<{ id: string; endpoint: string; p256dh: string; auth: string }>> {
  await ensureWebPushTable()
  try {
    const rows = await db.$queryRawUnsafe<Array<{ id: string; endpoint: string; p256dh: string; auth: string }>>(`SELECT * FROM WebPushSubscription ORDER BY createdAt DESC`)
    return rows.map(r => ({
      id: r.id,
      endpoint: r.endpoint,
      p256dh: r.p256dh,
      auth: r.auth
    }))
  } catch (err) {
    console.error("Error querying web push subscriptions:", err)
    return []
  }
}

/**
 * Encrypts a payload according to RFC 8291 (aes128gcm).
 */
function encryptPayload(userPublicKeyBase64: string, userAuthBase64: string, payloadString: string) {
  const userPublicKey = Buffer.from(userPublicKeyBase64, "base64url")
  const userAuth = Buffer.from(userAuthBase64, "base64url")

  // Generate local ephemeral ECDH keypair
  const localEcdh = crypto.createECDH("prime256v1")
  localEcdh.generateKeys()
  const localPublicKey = localEcdh.getPublicKey()

  // Shared secret
  const sharedSecret = localEcdh.computeSecret(userPublicKey)

  // Salt (16 bytes random)
  const salt = crypto.randomBytes(16)

  // RFC 8291 Section 3.2: info = "WebPush: info\0" || receiver_public_key || sender_public_key
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf-8"),
    userPublicKey,
    localPublicKey
  ])

  // IKM = HKDF-Expand(HKDF-Extract(userAuth, sharedSecret), keyInfo, 32)
  const ikm = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, userAuth, keyInfo, 32))

  // PRK = HKDF-Extract(salt, IKM)
  // CEK = HKDF-Expand(PRK, "Content-Encoding: aes128gcm\0", 16)
  const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0", "utf-8"), 16))

  // Nonce = HKDF-Expand(PRK, "Content-Encoding: nonce\0", 12)
  const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0", "utf-8"), 12))

  // Padding: 0x02 delimiter at end of record according to RFC 8188
  const payloadBuffer = Buffer.from(payloadString, "utf-8")
  const paddedPayload = Buffer.concat([payloadBuffer, Buffer.from([2])])

  // Cipher AES-128-GCM
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce)
  const encryptedPayload = Buffer.concat([cipher.update(paddedPayload), cipher.final()])
  const tag = cipher.getAuthTag()

  // Construct RFC 8291 header (salt + rs + idlen + keyid + ciphertext + tag)
  const rs = 4096
  const rsBuffer = Buffer.alloc(4)
  rsBuffer.writeUInt32BE(rs, 0)

  const keyIdLen = localPublicKey.length
  const keyIdLenBuffer = Buffer.alloc(1)
  keyIdLenBuffer.writeUInt8(keyIdLen, 0)

  const body = Buffer.concat([
    salt,
    rsBuffer,
    keyIdLenBuffer,
    localPublicKey,
    encryptedPayload,
    tag
  ])

  return body
}

/**
 * Sends a web push notification to a specific subscription.
 */
export async function sendWebPush(subscription: WebSubscription, payload: PushNotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadText = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/images/branding/logo-vendetta.png",
      badge: payload.badge || "/images/branding/logo-vendetta.png",
      url: payload.url || "/agenda",
      data: payload.data || {}
    })

    const encryptedBody = encryptPayload(
      subscription.keys.p256dh,
      subscription.keys.auth,
      payloadText
    )

    const vapidHeaders = getVapidAuthHeader(subscription.endpoint)

    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Urgency": "high"
    }

    if (vapidHeaders.Authorization) {
      headers["Authorization"] = vapidHeaders.Authorization
    }

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers,
      body: encryptedBody
    })

    if (response.status === 404 || response.status === 410) {
      console.log(`Push endpoint expired: ${subscription.endpoint}. Removing...`)
      await removeWebPushSubscription(subscription.endpoint)
      return { success: false, error: "Subscription expired" }
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Push service responded with error ${response.status}:`, errText)
      return { success: false, error: `HTTP ${response.status}: ${errText}` }
    }

    return { success: true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    console.error("Error sending web push:", error)
    return { success: false, error: msg }
  }
}

/**
 * Broadcasts a push notification to all subscribed devices/musicians.
 */
export async function broadcastWebPush(payload: PushNotificationPayload) {
  const subscriptions = await getWebPushSubscriptions()
  console.log(`📡 [WebPush] Broadcasting to ${subscriptions.length} subscribers...`)

  let successCount = 0
  let failCount = 0

  for (const sub of subscriptions) {
    const res = await sendWebPush(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      },
      payload
    )

    if (res.success) {
      console.log(`✅ [WebPush] Delivered to ${sub.endpoint.slice(0, 45)}...`)
      successCount++
    } else {
      console.error(`❌ [WebPush] Failed for ${sub.endpoint.slice(0, 45)}...: ${res.error}`)
      failCount++
    }
  }

  console.log(`📊 [WebPush] Broadcast complete: ${successCount} succeeded, ${failCount} failed.`)
  return { total: subscriptions.length, successCount, failCount }
}

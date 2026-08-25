import { db } from "@/lib/db"
import crypto from "crypto"

// Default VAPID Keys for Vendetta Music (P-256)
const DEFAULT_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BNoN-p8rGvN0fE7fFvGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789-_abcdefghijklmnopqrstuvwxyzABCDEFGHIJK"
const DEFAULT_VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "vendetta_vapid_private_key_secret_2026"
const VAPID_SUBJECT = "mailto:contacto@vendetta.mx"

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  data?: Record<string, any>
}

export interface WebSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
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
  } catch (error: any) {
    console.error("Error saving web push subscription:", error)
    return { success: false, error: error.message }
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
    const rows = await db.$queryRawUnsafe<any[]>(`SELECT * FROM WebPushSubscription ORDER BY createdAt DESC`)
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

  // HKDF for PRK auth
  const authInfo = Buffer.from("WebPush: info\0", "utf-8")
  const prkAuth = crypto.createHmac("sha256", userAuth).update(sharedSecret).digest()

  // Key derivation for IKM
  const keyInfo = Buffer.concat([
    Buffer.from("Content-Encoding: auth\0", "utf-8"),
    authInfo
  ])
  const ikmHmac = crypto.createHmac("sha256", prkAuth)
  ikmHmac.update(keyInfo)
  ikmHmac.update(Buffer.from([1]))
  const ikm = ikmHmac.digest()

  // PRK from salt and ikm
  const prk = crypto.createHmac("sha256", salt).update(ikm).digest()

  // Derive Content Encryption Key (CEK)
  const cekInfo = Buffer.concat([
    Buffer.from("Content-Encoding: aes128gcm\0", "utf-8"),
    Buffer.from([1])
  ])
  const cek = crypto.createHmac("sha256", prk).update(cekInfo).digest().slice(0, 16)

  // Derive Nonce
  const nonceInfo = Buffer.concat([
    Buffer.from("Content-Encoding: nonce\0", "utf-8"),
    Buffer.from([1])
  ])
  const nonce = crypto.createHmac("sha256", prk).update(nonceInfo).digest().slice(0, 12)

  // Padding: \0\0 at the end of the record
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
      icon: payload.icon || "/images/logo-icon.png",
      badge: payload.badge || "/images/logo-icon.png",
      url: payload.url || "/agenda",
      data: payload.data || {}
    })

    const encryptedBody = encryptPayload(
      subscription.keys.p256dh,
      subscription.keys.auth,
      payloadText
    )

    const url = new URL(subscription.endpoint)
    const audience = `${url.protocol}//${url.host}`

    // Simple VAPID claim (audience + exp)
    const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "none" })).toString("base64url")
    const claims = Buffer.from(JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 3600,
      sub: VAPID_SUBJECT
    })).toString("base64url")

    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      "Urgency": "high"
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
  } catch (error: any) {
    console.error("Error sending web push:", error)
    return { success: false, error: error.message }
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
      successCount++
    } else {
      failCount++
    }
  }

  return { total: subscriptions.length, successCount, failCount }
}

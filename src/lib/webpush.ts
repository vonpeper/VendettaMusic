import { db } from "@/lib/db"
import crypto from "crypto"
import webpush from "web-push"

// Real NIST P-256 VAPID Keys for Vendetta Music
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BNed5hz80wadrpiAoeOqHQ5SWOa5Fgw_OJepWU8zomvD9HLPObjZGM_oc4L219jhAicmbUiG4dgct3gRCm24R-U"
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "oyo-u47ia_nWqZnHsibBZ9lmApR6Rg-bBOntPBCH54k"
const VAPID_SUBJECT = "mailto:contacto@vendetta.mx"

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

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
    return (rows || []).map((r: { id: string; endpoint: string; p256dh: string; auth: string }) => ({
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
 * Sends a web push notification to a specific subscription using the official web-push engine.
 */
export async function sendWebPush(subscription: WebSubscription, payload: PushNotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const payloadText = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon.png",
      badge: payload.badge || "/icon.png",
      url: payload.url || "/agenda",
      data: payload.data || {}
    })

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      },
      payloadText,
      {
        TTL: 86400,
        urgency: "high"
      }
    )

    return { success: true }
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      console.log(`Push endpoint expired: ${subscription.endpoint}. Removing...`)
      await removeWebPushSubscription(subscription.endpoint)
      return { success: false, error: "Subscription expired" }
    }
    console.error("Error sending web push via web-push:", error)
    return { success: false, error: error?.message || "Error desconocido" }
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

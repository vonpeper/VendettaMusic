import { db } from "./db"

interface PushPayload {
  title: string
  body: string
  data?: Record<string, any>
}

/**
 * Sends a push notification to one or more user IDs.
 * Finds their registered Expo push tokens in the database and dispatches them via the Expo API.
 */
export async function sendPushNotificationToUsers(userIds: string | string[], payload: PushPayload) {
  const ids = Array.isArray(userIds) ? userIds : [userIds]
  const cleanIds = ids.filter(Boolean)
  if (cleanIds.length === 0) return

  // Query push tokens for the specified users
  const pushTokens = await db.pushToken.findMany({
    where: {
      userId: { in: cleanIds }
    },
    select: {
      token: true
    }
  })

  const tokens = pushTokens.map((pt: { token: string }) => pt.token)
  if (tokens.length === 0) {
    console.log("No push tokens registered for users:", cleanIds)
    return
  }

  await sendPushNotifications(tokens, payload)
}

/**
 * Directly sends a push notification to specific ExponentPushTokens.
 */
export async function sendPushNotifications(tokens: string[], payload: PushPayload) {
  const cleanTokens = tokens.filter(t => t && t.startsWith("ExponentPushToken"))
  if (cleanTokens.length === 0) return

  const messages = cleanTokens.map(token => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data
  }))

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(messages)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to send push notifications via Expo:", errorText)
      return
    }

    const result = await response.json()
    console.log("Expo push notifications sent successfully:", result)
  } catch (error) {
    console.error("Error sending push notifications:", error)
  }
}

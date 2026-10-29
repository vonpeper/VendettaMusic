import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { POST } from "../app/api/webhooks/evolution/route"
import { db } from "./db"
import { NextRequest } from "next/server"

describe("Filtro Estricto de Admisión en Webhook Evolution (route.ts)", () => {
  it("debe descartar inmediatamente mensajes provenientes de grupos (@g.us) sin escribir en la BD", async () => {
    const groupPayload = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: "120363024823904@g.us",
          fromMe: false,
          id: "WAGROUP123456"
        },
        message: {
          conversation: "Hola a todos en el grupo familiar"
        }
      }
    }

    const req = new NextRequest("http://localhost:3000/api/webhooks/evolution", {
      method: "POST",
      body: JSON.stringify(groupPayload),
      headers: {
        "content-type": "application/json"
      }
    })

    const initialInboxCount = await db.inboxItem.count()
    const res = await POST(req)
    const data = await res.json()

    assert.equal(data.ignored, true)
    assert.equal(data.reason, "group_message")

    const finalInboxCount = await db.inboxItem.count()
    assert.equal(finalInboxCount, initialInboxCount, "No debe registrar ningún InboxItem para mensajes grupales")
  })

  it("debe ignorar mensajes de números personales o no comerciales con reason 'non_commercial_contact'", async () => {
    const personalPayload = {
      event: "messages.upsert",
      data: {
        key: {
          remoteJid: "5219998887766@s.whatsapp.net",
          fromMe: false,
          id: "WAPERSONAL12345"
        },
        message: {
          conversation: "Hola, ¿cómo estás hoy?"
        }
      }
    }

    const req = new NextRequest("http://localhost:3000/api/webhooks/evolution", {
      method: "POST",
      body: JSON.stringify(personalPayload),
      headers: {
        "content-type": "application/json"
      }
    })

    const initialInboxCount = await db.inboxItem.count()
    const res = await POST(req)
    const data = await res.json()

    assert.equal(data.ignored, true)
    assert.equal(data.reason, "non_commercial_contact")

    const finalInboxCount = await db.inboxItem.count()
    assert.equal(finalInboxCount, initialInboxCount, "No debe registrar ningún InboxItem para números no comerciales")
  })
})

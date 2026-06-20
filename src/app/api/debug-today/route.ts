import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { startOfDay, endOfDay } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = startOfDay(now)
    const endOfToday = endOfDay(now)

    const todayEvents = await db.event.findMany({
      where: {
        date: {
          gte: startOfToday,
          lte: endOfToday
        }
      },
      include: {
        musicians: {
          include: {
            musician: {
              include: { user: true }
            }
          }
        }
      }
    })

    const debugInfo = todayEvents.map(e => ({
      eventId: e.id,
      date: e.date,
      customName: e.customName,
      status: e.status,
      musiciansCount: e.musicians.length,
      musicians: e.musicians.map(em => ({
        musicianEventId: em.id,
        musicianId: em.musician.id,
        name: em.musician.user?.name,
        email: em.musician.user?.email,
        status: em.status,
        profileStatus: em.musician.status,
        whatsapp: em.musician.whatsapp
      }))
    }))

    // Let's also check recently created notifications
    const recentNotifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 10
    })

    return NextResponse.json({
      success: true,
      debugInfo,
      recentNotifications
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

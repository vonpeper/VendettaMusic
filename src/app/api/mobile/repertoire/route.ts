import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getMobileUser } from "@/lib/mobile-auth"

export async function GET(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""

    const songs = await db.song.findMany({
      where: {
        status: "active",
        OR: query ? [
          { title: { contains: query } },
          { artist: { contains: query } },
          { genre: { contains: query } }
        ] : undefined
      },
      orderBy: [
        { artist: "asc" },
        { title: "asc" }
      ],
      take: 250 // Limit results to keep mobile performance snappy
    })

    // Also get suggestions suggested by this musician
    let suggestions: any[] = []
    if (user.musicianProfileId) {
      suggestions = await db.songSuggestion.findMany({
        where: {
          suggestedById: user.musicianProfileId
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    }

    return NextResponse.json({ success: true, songs, suggestions })
  } catch (error: any) {
    console.error("GET mobile repertoire error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getMobileUser(req)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const musicianProfileId = user.musicianProfileId
    if (!musicianProfileId) {
      return NextResponse.json({ error: "El usuario no es un músico registrado." }, { status: 403 })
    }

    const { title, artist, youtubeLink, spotifyLink, notes } = await req.json()
    if (!title || !artist) {
      return NextResponse.json({ error: "Título y artista son obligatorios." }, { status: 400 })
    }

    const suggestion = await db.songSuggestion.create({
      data: {
        title,
        artist,
        youtubeLink: youtubeLink || null,
        spotifyLink: spotifyLink || null,
        notes: notes || null,
        suggestedById: musicianProfileId,
        status: "pending"
      }
    })

    // Log the suggestion as a system notification
    await db.notification.create({
      data: {
        type: "SONG_SUGGESTION",
        channel: "mobile_app",
        message: `Músico ${user.name} sugirió la canción: "${title}" de ${artist}`,
        status: "sent"
      }
    }).catch(() => {})

    return NextResponse.json({ success: true, suggestion })
  } catch (error: any) {
    console.error("POST mobile repertoire error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

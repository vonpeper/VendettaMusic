import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
console.log("rehearsal:", !!db.rehearsal)
console.log("musicianProfile:", !!db.musicianProfile)
console.log("song:", !!db.song)

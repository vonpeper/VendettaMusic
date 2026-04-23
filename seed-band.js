const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

const MUSICIANS = [
  {
    name: "Mauricio",
    role: "Lead Vocal / Guitar",
    emoji: "🎤",
    img: "/images/musicians/mau.jpg",
    shortBio: "La voz principal y frontman de Vendetta. Su energía escénica es el motor que enciende cualquier recinto.",
    fullBio: "Con más de 10 años de experiencia en grandes escenarios, Mau combina su potencia vocal con un carisma magnético. Especialista en mantener a la audiencia al borde de la locura durante todo el show.",
    ig: "https://instagram.com/mau.vendetta",
    order: 1
  },
  {
    name: "Charly",
    role: "Lead Guitar / Backup Vocals",
    emoji: "🎸",
    img: "/images/musicians/charly.jpg",
    shortBio: "El arquitecto de los riffs agresivos y los solos de estadio de Vendetta.",
    fullBio: "Charly no solo destroza la guitarra, sino que inyecta una energía visual arrolladora. Su tono rasposo y ejecución precisa garantizan la pared de sonido característica de la banda.",
    ig: "https://instagram.com/charly.guitars",
    order: 2
  },
  {
    name: "Mike",
    role: "Bass Guitar",
    emoji: "🔊",
    img: "/images/musicians/mike.jpg",
    shortBio: "El cimiento rítmico. Su bajo es el latido que sincroniza a toda la pista de baile.",
    fullBio: "Mike fusiona el groove del funk con la agresividad del rock pesado. Es el encargado de crear esa frecuencia en el pecho que te obliga a saltar sin darte cuenta.",
    ig: "https://instagram.com/mike.bass",
    order: 3
  },
  {
    name: "Fersho",
    role: "Drums & Percussion",
    emoji: "🥁",
    img: "/images/musicians/fersho.jpg",
    shortBio: "La máquina detrás de los tambores. Golpes letales y precisión de metrónomo humano.",
    fullBio: "Con influencias que van desde el metal progresivo hasta el pop de estadio, Fersho controla la dinámica del show y dicta qué tan explosivo será cada bloque musical.",
    ig: "https://instagram.com/fersho.drums",
    order: 4
  },
  {
    name: "Alex",
    role: "Keyboard / Synths",
    emoji: "🎹",
    img: "/images/musicians/alex.jpg",
    shortBio: "Melodías y atmósferas que completan el sonido premium de Vendetta.",
    fullBio: "Especialista en síntesis y diseño sonoro. Aporta la capa moderna y orquestal que hace que nuestros covers suenen como el disco.",
    ig: "https://instagram.com/alex.keys",
    order: 5
  },
]

async function seed() {
  const count = await prisma.publicBandMember.count()
  if (count === 0) {
    for (const m of MUSICIANS) {
      await prisma.publicBandMember.create({ data: m })
    }
    console.log("Seeded PublicBandMembers")
  } else {
    console.log("Already seeded")
  }
}

seed().catch(console.error).finally(() => prisma.$disconnect())

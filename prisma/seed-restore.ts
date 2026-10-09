/**
 * Restaura los paquetes históricos perdidos en el deploy nuevo.
 * Idempotente: usa upsert por id, así puede correrse varias veces sin duplicar.
 *
 * Uso (local):       npx tsx prisma/seed-restore.ts
 * Uso (producción):  docker exec -it vendetta-app npx tsx prisma/seed-restore.ts
 */
import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import "dotenv/config"

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
})
const prisma = new PrismaClient({ adapter })

const PACKAGES = [
  {
    id: "61a5477c-de10-4788-a8bd-1dfa8b57d256",
    name: "Essential",
    baseCostPerHour: 4250,
    minDuration: 2,
    description: "El paquete base para eventos sociales pequeños.",
    includes: "Audio EV, Backline, Luces RGB, 4 músicos, Staff, 2 sets",
    isCustom: false,
    active: true,
  },
  {
    id: "clx-experience-id",
    name: "Experience",
    baseCostPerHour: 7750,
    minDuration: 2,
    description: null,
    includes: "Todo Essential + Audio profesional (100-300 pers)",
    isCustom: false,
    active: true,
  },
  {
    id: "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62",
    name: "Festival Premium",
    baseCostPerHour: 12750,
    minDuration: 2,
    description: "Producción completa para bodas y corporativos.",
    includes: "Todo Experience + Templete, Pantalla LED, Robóticas",
    isCustom: false,
    active: true,
  },
  {
    id: "custom",
    name: "Arma tu show",
    baseCostPerHour: 4000,
    minDuration: 2,
    description: null,
    includes: "",
    isCustom: true,
    active: true,
  },
]

const EXTRAS = [
  { id: "069e2800-5c1c-4f65-a60e-ef123f2ee104", packageId: "61a5477c-de10-4788-a8bd-1dfa8b57d256", name: "Hora Extra",            setupCost: 0,     hourlyCost: 5000 },
  { id: "41e2a913-d1d8-4642-9dec-af921d4735b2", packageId: "61a5477c-de10-4788-a8bd-1dfa8b57d256", name: "Luces Arquitectónicas", setupCost: 3500,  hourlyCost: 0    },
  { id: "7f5fd93f-d882-455f-93e4-b40e741993bf", packageId: "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62", name: "Hora Extra",            setupCost: 0,     hourlyCost: 8000 },
  { id: "ddc8429f-492a-4732-b905-492a3a02583c", packageId: "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62", name: "Pantalla LED P3",       setupCost: 15000, hourlyCost: 0    },
]

// ServiceItems aparecen como bullets en las cards del home (PaquetesSection).
// Cada paquete enlaza un subconjunto vía _PackageToService.
const SERVICE_ITEMS = [
  { id: "svc-audio-ev",       name: "Audio EV",                          icon: "Volume2",   order: 1 },
  { id: "svc-audio-pro",      name: "Audio Profesional (100-300 pers)",  icon: "Volume2",   order: 2 },
  { id: "svc-backline",       name: "Backline completo",                  icon: "Music2",    order: 3 },
  { id: "svc-luces-rgb",      name: "Luces RGB",                          icon: "Lightbulb", order: 4 },
  { id: "svc-roboticas",      name: "Iluminación Robótica",                icon: "Zap",       order: 5 },
  { id: "svc-templete",       name: "Templete",                            icon: "Star",      order: 6 },
  { id: "svc-pantalla-led",   name: "Pantalla LED",                        icon: "Monitor",   order: 7 },
  { id: "svc-4-musicos",      name: "4 músicos",                           icon: "Users",     order: 8 },
  { id: "svc-staff",          name: "Staff técnico",                       icon: "Users",     order: 9 },
  { id: "svc-2-sets",         name: "2 sets",                              icon: "Mic2",      order: 10 },
  { id: "svc-todo-essential", name: "Todo lo de Essential",                icon: "Check",     order: 11 },
  { id: "svc-todo-experience",name: "Todo lo de Experience",               icon: "Check",     order: 12 },
]

const PACKAGE_TO_SERVICE: Record<string, string[]> = {
  "61a5477c-de10-4788-a8bd-1dfa8b57d256": [ // Essential
    "svc-audio-ev", "svc-backline", "svc-luces-rgb", "svc-4-musicos", "svc-staff", "svc-2-sets",
  ],
  "clx-experience-id": [ // Experience
    "svc-todo-essential", "svc-audio-pro",
  ],
  "4e3406f6-cb05-4cf4-805b-24b5cd9c2b62": [ // Festival Premium
    "svc-todo-experience", "svc-templete", "svc-pantalla-led", "svc-roboticas",
  ],
}

const PUBLIC_BAND_MEMBERS = [
  {
    id: "uuid-1",
    name: "Pepe Bautista",
    role: "Guitarra & Voz Líder",
    emoji: "🎤",
    img: "/images/musicians/pepe.jpg",
    shortBio: "Fundador de Vendetta con más de 15 años en la escena musical.",
    fullBio: "Músico multi-instrumentista y productor. Líder del proyecto y responsable de la dirección artística que hace de cada show una experiencia única.",
    ig: "https://instagram.com/pp.bau",
    order: 1,
  },
  {
    id: "016417cc-8620-4728-8196-0baae75ec9a6",
    name: "Brenda Menel",
    role: "Cantante",
    emoji: "✨",
    img: "/images/musicians/maryx.jpg",
    shortBio: "Voz femenina principal con gran potencia vocal y dinamismo escénico.",
    fullBio: "Vocalista líder de Vendetta, especialista en encender al público con los mejores himnos de pop y rock en inglés y español.",
    ig: null,
    order: 2,
  },
  {
    id: "uuid-3",
    name: "Edgar Mariaud",
    role: "Bajo",
    emoji: "🎸",
    img: "/images/musicians/edgar.jpg",
    shortBio: "El alma rítmica y la profundidad del sonido de Vendetta.",
    fullBio: "Bajista con un Groove impecable y gran presencia escénica. Su precisión en las frecuencias bajas es el cimiento de nuestra energía en vivo.",
    ig: "https://www.instagram.com/elpipolisimo",
    order: 3,
  },
  {
    id: "uuid-4",
    name: "Diego Piña",
    role: "Batería",
    emoji: "🥁",
    img: "/images/musicians/diego.jpg",
    shortBio: "Precisión y potencia que mantienen el beat de la fiesta arriba.",
    fullBio: "Baterista de sesión con una energía inagotable. Es el motor rítmico que impulsa cada canción del repertorio.",
    ig: "https://www.instagram.com/diego.gopi",
    order: 4,
  },
  {
    id: "uuid-5",
    name: "Alekz",
    role: "Teclado",
    emoji: "🎹",
    img: "/images/musicians/alex.jpg",
    shortBio: "Melodías y atmósferas que completan el sonido premium de Vendetta.",
    fullBio: "Especialista en síntesis y diseño sonoro. Aporta la capa moderna y orquestal que hace que nuestros covers suenen como el disco.",
    ig: "https://www.instagram.com/alekz_hr/",
    order: 5,
  },
]

async function main() {
  console.log("🎸 Restaurando paquetes históricos...")

  for (const p of PACKAGES) {
    await prisma.package.upsert({
      where:  { id: p.id },
      update: { ...p },
      create: { ...p },
    })
    console.log(`  ✅ ${p.name}`)
  }

  for (const e of EXTRAS) {
    await prisma.packageService.upsert({
      where:  { id: e.id },
      update: { ...e },
      create: { ...e },
    })
    console.log(`  ➕ ${e.name} (${e.packageId.slice(0, 8)}…)`)
  }

  for (const s of SERVICE_ITEMS) {
    await prisma.serviceItem.upsert({
      where:  { id: s.id },
      update: { ...s, category: "Inclusión", active: true },
      create: { ...s, category: "Inclusión", active: true },
    })
  }
  console.log(`  📋 ${SERVICE_ITEMS.length} ServiceItems en catálogo`)

  for (const [pkgId, serviceIds] of Object.entries(PACKAGE_TO_SERVICE)) {
    await prisma.package.update({
      where: { id: pkgId },
      data:  { serviceItems: { set: serviceIds.map(id => ({ id })) } },
    })
    console.log(`  🔗 ${pkgId.slice(0, 8)}… → ${serviceIds.length} bullets`)
  }

  console.log("👥 Restaurando y sincronizando alineación de músicos...")
  for (const m of PUBLIC_BAND_MEMBERS) {
    await prisma.publicBandMember.upsert({
      where: { id: m.id },
      update: {
        name: m.name,
        role: m.role,
        emoji: m.emoji,
        img: m.img,
        shortBio: m.shortBio,
        fullBio: m.fullBio,
        ig: m.ig,
        order: m.order,
      },
      create: { ...m },
    })
    console.log(`  👤 ${m.name} -> ${m.ig ?? "(sin link de IG)"}`)
  }

  // Sincronizar enlaces oficiales de Instagram por nombre
  await prisma.publicBandMember.updateMany({
    where: { name: { contains: "Pepe" } },
    data: { ig: "https://www.instagram.com/pp.bau" },
  })

  await prisma.publicBandMember.updateMany({
    where: { name: { contains: "Edgar" } },
    data: { ig: "https://www.instagram.com/elpipolisimo" },
  })

  await prisma.publicBandMember.updateMany({
    where: { name: { contains: "Diego" } },
    data: { ig: "https://www.instagram.com/diego.gopi" },
  })

  await prisma.publicBandMember.updateMany({
    where: {
      OR: [
        { name: { contains: "Alex" } },
        { name: { contains: "Alekz" } },
      ],
    },
    data: { ig: "https://www.instagram.com/alekz_hr/" },
  })

  // Asegurar que el resto de los integrantes no tengan links erróneos
  await prisma.publicBandMember.updateMany({
    where: {
      AND: [
        { NOT: { name: { contains: "Pepe" } } },
        { NOT: { name: { contains: "Edgar" } } },
        { NOT: { name: { contains: "Diego" } } },
        { NOT: { name: { contains: "Alex" } } },
        { NOT: { name: { contains: "Alekz" } } },
      ],
    },
    data: {
      ig: null,
    },
  })

  await prisma.globalConfig.upsert({
    where:  { id: "vendetta_config" },
    update: {},
    create: { id: "vendetta_config", zona2Rate: 1500, zona3Rate: 3000 },
  })
  console.log("  🌎 GlobalConfig vendetta_config listo (zona2=1500, zona3=3000)")

  const total = await prisma.package.count({ where: { active: true } })
  console.log(`\n✨ Restauración completa. Paquetes activos en DB: ${total}`)
}

main()
  .catch((e) => {
    console.error("❌ Error en restauración:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

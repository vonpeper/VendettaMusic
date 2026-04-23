import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import "dotenv/config"

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Database...')

  // Clean DB (avoid in prod, but safe in dev)
  await prisma.user.deleteMany()
  await prisma.package.deleteMany()

  const passwordHash = await hash('password123', 10)

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Vendetta',
      email: 'admin@vendetta.com',
      password: passwordHash,
      role: 'ADMIN'
    }
  })
  console.log('Created Admin:', admin.email)

  // 2. Create sample Client
  const client = await prisma.user.create({
    data: {
      name: 'Cliente Demo',
      email: 'cliente@ejemplo.com',
      password: passwordHash,
      role: 'CLIENT',
      clientProfile: {
        create: {
          phone: '5551234567',
          type: 'private'
        }
      }
    }
  })
  console.log('Created Client:', client.email)

  // 3. Create Sample Musician
  const musician = await prisma.user.create({
    data: {
      name: 'Guitarrista Vendetta',
      email: 'guitarra@vendetta.com',
      password: passwordHash,
      role: 'MUSICIAN',
      musicianProfile: {
        create: {
          instrument: 'Guitarra Eléctrica'
        }
      }
    }
  })

  // 4. Create Sample Packages
  const pkg1 = await prisma.package.create({
    data: {
      name: 'Vendetta Essential',
      baseCostPerHour: 5000,
      minDuration: 3,
      description: 'El paquete base para eventos sociales pequeños.',
      includes: 'Quinteto base, audio estándar, staff básico.',
      services: {
        create: [
          { name: 'Hora Extra', hourlyCost: 5000 },
          { name: 'Luces Arquitectónicas', setupCost: 3500 }
        ]
      }
    }
  })
  
  const pkg2 = await prisma.package.create({
    data: {
      name: 'Vendetta Premium',
      baseCostPerHour: 8000,
      minDuration: 5,
      description: 'Producción completa para bodas y corporativos.',
      includes: 'Septeto con metales, escenario, iluminación robótica, ingeniero de sala.',
      services: {
        create: [
          { name: 'Hora Extra', hourlyCost: 8000 },
          { name: 'Pantalla LED P3', setupCost: 15000 }
        ]
      }
    }
  })

  // 5. Sample Repertoires
  await prisma.song.createMany({
    data: [
      { title: 'Treasure', artist: 'Bruno Mars', language: 'English', genre: 'Pop/Funk' },
      { title: 'La Incondicional', artist: 'Luis Miguel', language: 'Spanish', genre: 'Balada' },
      { title: 'Don\'t Stop Believin\'', artist: 'Journey', language: 'English', genre: 'Rock' },
      { title: 'Danza Kuduro', artist: 'Don Omar', language: 'Spanish', genre: 'Urbano/Latino' }
    ]
  })

  console.log('Seed Complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

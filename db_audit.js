const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("--- DATA AUDIT ---")
  
  const clients = await prisma.clientProfile.findMany()
  const clientsWithoutPhone = clients.filter(c => !c.phone || c.phone.trim() === "")
  console.log(`Clients total: ${clients.length}, Without Phone: ${clientsWithoutPhone.length}`)

  const locations = await prisma.location.findMany()
  const locsWithoutMaps = locations.filter(l => !l.mapsUrl || l.mapsUrl.trim() === "")
  console.log(`Locations total: ${locations.length}, Without Maps URL: ${locsWithoutMaps.length}`)

  const events = await prisma.event.findMany({ include: { client: true, location: true } })
  const eventsWithoutClient = events.filter(e => !e.clientId)
  const eventsWithoutPackage = events.filter(e => !e.packageId)
  console.log(`Events total: ${events.length}, Without Client: ${eventsWithoutClient.length}, Without Package: ${eventsWithoutPackage.length}`)

  const bookingRequests = await prisma.bookingRequest.findMany()
  const bookingWithoutEvent = bookingRequests.filter(b => !b.eventId)
  console.log(`Booking Requests total: ${bookingRequests.length}, Without Event ID: ${bookingWithoutEvent.length}`)

  const contracts = await prisma.contract.findMany()
  const unsignedContracts = contracts.filter(c => c.status !== "signed")
  console.log(`Contracts total: ${contracts.length}, Unsigned: ${unsignedContracts.length}`)

  const quotes = await prisma.quote.findMany()
  console.log(`Quotes total (Legacy?): ${quotes.length}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

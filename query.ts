import { db } from './src/lib/db'
async function main() {
  const b = await db.bookingRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: { event: true }
  })
  console.log(JSON.stringify(b, null, 2))
}
main()

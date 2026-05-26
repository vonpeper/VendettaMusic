import * as dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

// IMPORTANT: Import db AFTER dotenv
import { db } from "../src/lib/db"

async function check() {
  const allBookings = await db.bookingRequest.findMany({
    select: {
      status: true,
      requestedDate: true,
      paymentStatus: true
    }
  });
  console.log(`Total bookings: ${allBookings.length}`);
  const statusCounts = allBookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as any);
  console.log("Status counts:", statusCounts);
}

check().finally(() => db.$disconnect())

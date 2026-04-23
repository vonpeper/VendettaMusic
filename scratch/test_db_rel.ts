import { db } from "./src/lib/db";

async function testRel() {
  console.log("🚀 Testing relationship linking...");
  
  // Find a test event and a test location
  const event = await db.event.findFirst({});
  const location = await db.location.findFirst({});
  
  if (!event || !location) {
    console.error("❌ No event or location found for testing.");
    return;
  }
  
  console.log(`Testing with Event ID: ${event.id}`);
  console.log(`Linking to Location ID: ${location.id} (${location.name})`);
  
  // Test CONNECT
  const updated = await db.event.update({
    where: { id: event.id },
    data: {
      location: { connect: { id: location.id } }
    }
  });
  
  if (updated.locationId === location.id) {
    console.log("✅ CONNECT success! locationId correctly set.");
  } else {
    console.error(`❌ CONNECT failed. locationId is ${updated.locationId}, expected ${location.id}`);
  }
  
  // Test DISCONNECT
  const disconnected = await db.event.update({
    where: { id: event.id },
    data: {
      location: { disconnect: true }
    }
  });
  
  if (disconnected.locationId === null) {
    console.log("✅ DISCONNECT success! locationId correctly set to null.");
  } else {
    console.error(`❌ DISCONNECT failed. locationId is ${disconnected.locationId}, expected null`);
  }
}

testRel().catch(console.error);

import { db } from "../src/lib/db";
import { notifyMusicians } from "../src/lib/notifications";

async function runTests() {
  console.log("=== VENDETTA QA TEST SCRIPT ===");

  // 1. Seed Users and Musicians
  console.log("Seeding test data...");
  const brendaUser = await db.user.upsert({
    where: { email: "brenda@test.com" },
    update: {},
    create: { name: "Brenda Menel", email: "brenda@test.com", role: "admin" }
  });
  const otherUser = await db.user.upsert({
    where: { email: "other@test.com" },
    update: {},
    create: { name: "Other Musician", email: "other@test.com", role: "musician" }
  });

  const brenda = await db.musicianProfile.upsert({
    where: { userId: brendaUser.id },
    update: { whatsapp: "525512345678" },
    create: { id: "qa-brenda-123", userId: brendaUser.id, instrument: "Voz", whatsapp: "525512345678" }
  });

  const other = await db.musicianProfile.upsert({
    where: { userId: otherUser.id },
    update: { whatsapp: "525587654321" },
    create: { id: "qa-other-123", userId: otherUser.id, instrument: "Guitarra", whatsapp: "525587654321" }
  });

  const fakeClientId = "qa-client-123";
  await db.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: { name: "QA Client", email: "client@test.com", role: "client",
      clientProfile: { create: { id: fakeClientId, company: "QA Inc" } }
    }
  });

  const fakePackageId = "qa-package-123";
  await db.package.upsert({
    where: { id: fakePackageId },
    update: {},
    create: { id: fakePackageId, name: "QA Package", baseCostPerHour: 1000, minDuration: 2 }
  });

  const fakeEventId = "test-event-qa-123";
  await db.event.upsert({
    where: { id: fakeEventId },
    update: {},
    create: { id: fakeEventId, date: new Date(), status: "agendado", clientId: fakeClientId, packageId: fakePackageId }
  });

  await db.eventMusician.deleteMany({ where: { eventId: fakeEventId } });
  await db.eventMusician.create({ data: { id: `qa-${brenda.id}`, eventId: fakeEventId, musicianId: brenda.id, status: "pending" }});
  await db.eventMusician.create({ data: { id: `qa-${other.id}`, eventId: fakeEventId, musicianId: other.id, status: "pending" }});

  const gigDetails = {
    clientName: "QA Test Client",
    date: "2026-12-31",
    ceremonyType: "Boda",
    locationName: "Test Location",
    mapsLink: "https://maps.google.com/test",
    performanceStart: "21:00",
    arrivalTime: "19:00",
    setupTime: "18:00",
    dressCode: "Formal",
    musicianNotes: "QA Testing Notes",
    packageName: "Paquete Boda Premium", 
  };

  await db.globalConfig.upsert({
    where: { id: "vendetta_config" },
    update: { isSandbox: false },
    create: { id: "vendetta_config", isSandbox: false }
  });

  console.log("\n--- TEST 1: Brenda Menel Notification ---");
  await notifyMusicians(fakeEventId, gigDetails, db, [brenda.id]);
  const notifs1 = await db.notification.findMany({ where: { type: "musician_gig" }, orderBy: { createdAt: "desc" }, take: 2 });
  console.log("Notified Brenda?", notifs1.some(n => n.recipient === "525512345678"));

  console.log("\n--- TEST 2 & 3: Deselection Logic & Other Musician ---");
  await notifyMusicians(fakeEventId, gigDetails, db, [other.id]);
  const notifs2 = await db.notification.findMany({ where: { type: "musician_gig" }, orderBy: { createdAt: "desc" }, take: 2 });
  console.log("Notified Other?", notifs2.some(n => n.recipient === "525587654321"));
  
  const assignments = await db.eventMusician.findMany({ where: { eventId: fakeEventId } });
  console.log("Brenda still assigned?", assignments.some(a => a.musicianId === brenda.id));
  console.log("Other still assigned?", assignments.some(a => a.musicianId === other.id));
  
  console.log("\n--- TEST 5: Message Content Analysis ---");
  const msg = notifs2[0]?.message || "";
  console.log("Message Output:\n" + msg);
  console.log("Includes Package (Paquete Boda Premium)?", msg.includes("Paquete Boda Premium"));
  console.log("Includes Price/Money symbol?", msg.includes("$") || msg.includes("MXN"));
  console.log("Includes Map Link?", msg.includes("https://maps.google.com/test"));
  console.log("Includes Arrival Time (19:00)?", msg.includes("19:00"));
  console.log("Includes Setup Time (18:00)?", msg.includes("18:00"));
  console.log("Includes Dress Code (Formal)?", msg.includes("Formal"));

  console.log("\n=== TESTS COMPLETE ===");
}

runTests().catch(console.error).finally(() => process.exit(0));

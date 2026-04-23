import { db } from '../src/lib/db';

async function test() {
  console.log("--- TEST 1: Simple findFirst ---");
  const users = await db.user.findMany({ take: 1 });
  console.log("Users:", users.length);

  console.log("\n--- TEST 2: OR Query (Phone or WhatsApp) ---");
  const phone = "1234567890"; // From the subagent's test if it saved partially
  const found = await db.clientProfile.findMany({
    where: {
      OR: [
        { phone: phone },
        { whatsapp: phone }
      ]
    }
  });
  console.log("Found by OR:", found.length);

  console.log("\n--- TEST 3: AND Query ---");
  const andFound = await db.clientProfile.findMany({
    where: {
      AND: [
        { city: { contains: "Test" } },
        { state: { contains: "México" } }
      ]
    }
  });
  console.log("Found by AND:", andFound.length);

  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});

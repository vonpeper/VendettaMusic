import { db } from "../src/lib/db";

async function verify() {
  console.log("🚀 Testing nested client creation...");
  const testEmail = `test_save_${Date.now()}@example.com`;
  
  try {
    const user = await db.user.create({
      data: {
        name: "Test Client Save",
        email: testEmail,
        password: "hashed_password",
        role: "CLIENT",
        clientProfile: {
          create: {
            phone: "1234567890",
            whatsapp: "1234567890",
            city: "Test City",
            notes: "Testing nested create support"
          }
        }
      }
    });

    console.log("✅ User created:", user.id);

    // Verify if client profile was created
    const profile = await db.clientProfile.findUnique({
      where: { userId: user.id }
    });

    if (profile) {
      console.log("✅ ClientProfile created correctly:", profile.id);
      console.log("📱 Phone:", profile.phone);
    } else {
      console.error("❌ ClientProfile NOT created!");
    }

    // Testing include
    console.log("\n🚀 Testing 'include' support...");
    const userWithProfile = await db.user.findUnique({
      where: { id: user.id },
      include: { clientProfile: true }
    });

    if (userWithProfile?.clientProfile) {
      console.log("✅ Include worked! Profile found inside user object.");
    } else {
      console.error("❌ Include failed! Profile not found inside user.");
    }

  } catch (error) {
    console.error("❌ Error during verification:", error);
  }
}

verify();

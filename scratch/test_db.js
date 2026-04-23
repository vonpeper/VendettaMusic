import { db } from "./src/lib/db.js"

async function test() {
  try {
    console.log("Testing DB create...")
    const user = await db.user.create({
      data: {
        name: "Test User",
        role: "CLIENT"
      }
    })
    console.log("User created:", user)
    if (!user) {
      console.log("FAILED: User is undefined")
    } else if (!user.id) {
      console.log("FAILED: User has no ID")
    } else {
      console.log("SUCCESS: User has ID", user.id)
    }
  } catch (e) {
    console.error("CRITICAL ERROR:", e)
  }
}

test()

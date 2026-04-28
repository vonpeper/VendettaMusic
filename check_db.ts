import { db } from "./src/lib/db";

async function checkConfig() {
  try {
    const config = await db.globalConfig.findUnique({ where: { id: "singleton" } });
    console.log("=== GLOBAL CONFIG IN DATABASE ===");
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkConfig();

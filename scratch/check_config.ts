import { db } from "./src/lib/db";

async function checkConfig() {
  const config = await db.globalConfig.findUnique({ where: { id: "singleton" } });
  console.log("Current Config:", JSON.stringify(config, null, 2));
}

checkConfig();

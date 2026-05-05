const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
async function main() {
  const pkgs = await db.package.findMany({
    where: { active: true, NOT: { isCustom: true } },
    include: { serviceItems: { orderBy: { order: "asc" } } },
    orderBy: { baseCostPerHour: "asc" }
  });
  console.log(JSON.stringify(pkgs.map(p => ({
    name: p.name,
    includes: p.includes,
    serviceItemsCount: p.serviceItems.length
  })), null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());

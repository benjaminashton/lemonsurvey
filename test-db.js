const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const settings = await prisma.platformSettings.findMany();
  console.log("Settings in DB:", settings);
}
main().finally(() => prisma.$disconnect());

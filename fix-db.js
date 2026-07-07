require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.update({
    where: { email: 'user' },
    data: { username: 'user' }
  });
  await prisma.user.update({
    where: { email: 'admin' },
    data: { username: 'superadmin' }
  });
  await prisma.user.update({
    where: { email: 'admin@lemonsurvey.dev' },
    data: { username: 'admin' }
  });
  console.log('Fixed usernames');
}
main().finally(() => prisma.$disconnect());

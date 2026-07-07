require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lemonsurvey' });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { username: 'admin' }
    });
    console.log('Username set to admin for user: ' + user.email);
  } else {
    console.log('No user found in DB');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

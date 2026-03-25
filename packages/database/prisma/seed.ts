import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: 'oss-user-id' },
    create: {
      id: 'oss-user-id',
      email: 'oss@localhost',
      name: 'OSS User',
      role: UserRole.ADMIN,
    },
    update: {},
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

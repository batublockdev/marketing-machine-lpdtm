import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:BDQhRVQZxLdSpBrFJdKvEJXqPZlUlShg@shuttle.proxy.rlwy.net:46796/railway?sslmode=require'
    }
  }
});

async function main() {
  // Eliminar todos los tokens de TikTok
  const result = await prisma.tikTokToken.deleteMany({});
  
  console.log(`✅ Tokens eliminados: ${result.count}`);
  
  await prisma.$disconnect();
}

main();
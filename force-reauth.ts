import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:BDQhRVQZxLdSpBrFJdKvEJXqPZlUlShg@shuttle.proxy.rlwy.net:46796/railway?sslmode=require'
    }
  }
});

async function main() {
  // Eliminar TODOS los tokens existentes
  console.log('🗑️  Eliminando tokens antiguos...');
  const deleted = await prisma.tikTokToken.deleteMany({});
  console.log(`✅ ${deleted.count} tokens eliminados`);
  
  console.log('\n📋 INSTRUCCIONES:');
  console.log('1. Ve al dashboard: https://marketing-machine-lpdtm-production.up.railway.app');
  console.log('2. Click en "Conectar TikTok"');
  console.log('3. Verifica que la pantalla de autorización muestre la app correcta');
  console.log('4. Autoriza y espera el callback');
  console.log('');
  console.log('⚠️  IMPORTANTE: En la pantalla de autorización de TikTok,');
  console.log('   debería aparecer el nombre de tu app LIVE, no la sandbox.');
  console.log('');
  console.log('Si aparece la app sandbox, el problema está en:');
  console.log('- Las variables de entorno de Railway');
  console.log('- El redirect URI en TikTok Developer Portal');
  
  await prisma.$disconnect();
}

main();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:BDQhRVQZxLdSpBrFJdKvEJXqPZlUlShg@shuttle.proxy.rlwy.net:46796/railway?sslmode=require'
    }
  }
});

async function main() {
  const token = await prisma.tikTokToken.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!token) {
    console.log('❌ No hay token. Necesitas conectar TikTok desde el dashboard.');
    return;
  }
  
  console.log('=== VERIFICANDO PERMISOS DE LA APP ===\n');
  console.log('Token Open ID:', token.openId);
  console.log('Token Scope:', token.scope);
  console.log('Token Updated:', token.updatedAt);
  
  // Obtener creator info para ver los privacy levels disponibles
  const creatorRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
  
  const creatorData = await creatorRes.json();
  console.log('\nCreator Info:');
  console.log('Username:', creatorData.data?.creator_username);
  console.log('Privacy levels permitidos:', creatorData.data?.privacy_level_options);
  
  // Intentar init con diferentes privacy levels
  console.log('\n=== PROBANDO PRIVACY LEVELS ===\n');
  
  const privacyLevels = ['SELF_ONLY', 'MUTUAL_FOLLOW_FRIENDS', 'PUBLIC_TO_EVERYONE'];
  
  for (const level of privacyLevels) {
    console.log(`\n--- Probando: ${level} ---`);
    
    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        post_info: {
          title: 'Test',
          privacy_level: level,
          disable_duet: true,
          disable_comment: true,
          disable_stitch: true,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: 1000000,
          chunk_size: 1000000,
          total_chunk_count: 1
        }
      })
    });
    
    const initData = await initRes.json();
    
    if (initData.error) {
      console.log('❌ Error:', initData.error.code);
      console.log('   Message:', initData.error.message);
    } else {
      console.log('✅ SUCCESS! Privacy level permitido:', level);
      console.log('   Publish ID:', initData.data?.publish_id);
    }
  }
  
  console.log('\n=== DIAGNÓSTICO ===\n');
  console.log('Si solo SELF_ONLY funciona:');
  console.log('  → La app está en modo "Unaudited" (no auditada)');
  console.log('  → TikTok requiere revisión manual para publicación pública');
  console.log('  → SOLUCIÓN: Publicar como SELF_ONLY y luego cambiar a público desde la app de TikTok');
  console.log('');
  console.log('Si ningún nivel funciona:');
  console.log('  → Verificar que el Client Key sea de la app correcta');
  console.log('  → Verificar que el token fue generado con la app live');
  console.log('  → Ir a TikTok Developer Portal y verificar status');
  
  await prisma.$disconnect();
}

main();
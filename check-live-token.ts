import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:BDQhRVQZxLdSpBrFJdKvEJXqPZlUlShg@shuttle.proxy.rlwy.net:46796/railway?sslmode=require'
    }
  }
});

async function main() {
  // Obtener el token más reciente
  const token = await prisma.tikTokToken.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!token) {
    console.log('❌ No hay token');
    return;
  }
  
  console.log('=== TOKEN ACTUAL ===');
  console.log('Open ID:', token.openId);
  console.log('Scope:', token.scope);
  console.log('Updated:', token.updatedAt);
  console.log('');
  
  // Verificar si expiró
  const tokenAge = Date.now() - token.updatedAt.getTime();
  const expiresMs = token.expiresIn * 1000;
  const remaining = expiresMs - tokenAge;
  
  if (remaining < 0) {
    console.log('❌ Token EXPIRADO');
    return;
  }
  
  console.log('⏳ Tiempo restante:', Math.floor(remaining / 1000 / 60), 'minutos');
  
  // Probar init con SELF_ONLY (privado)
  console.log('\n=== TEST CON SELF_ONLY ===');
  
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      post_info: {
        title: 'Test video',
        privacy_level: 'SELF_ONLY',
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
  console.log('Response SELF_ONLY:');
  console.log(JSON.stringify(initData, null, 2));
  
  // Probar init con PUBLIC_TO_EVERYONE
  console.log('\n=== TEST CON PUBLIC_TO_EVERYONE ===');
  
  const initRes2 = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      post_info: {
        title: 'Test video',
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
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
  
  const initData2 = await initRes2.json();
  console.log('Response PUBLIC_TO_EVERYONE:');
  console.log(JSON.stringify(initData2, null, 2));
  
  // Verificar información de la app
  console.log('\n=== VERIFICACIÓN ===');
  console.log('Client Key usado en código:', 'awc2yu9d4jywgi8h');
  console.log('Si el error persiste con PUBLIC_TO_EVERYONE, verificar:');
  console.log('1. La app en TikTok Developer Portal tiene status "Live"');
  console.log('2. La app tiene el producto "Content Posting API" habilitado');
  console.log('3. Los scopes incluyen video.upload y video.publish');
  console.log('4. La cuenta @trust.app7 está como Target User en Sandbox (si aplica)');
  
  await prisma.$disconnect();
}

main();
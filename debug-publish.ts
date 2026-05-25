import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:BDQhRVQZxLdSpBrFJdKvEJXqPZlUlShg@shuttle.proxy.rlwy.net:46796/railway?sslmode=require'
    }
  }
});

const TIKTOK_CONFIG = {
  client_key: 'awc2yu9d4jywgi8h',
  client_secret: 'lKW0Zu1zDOpnifeSuDUjd6MPlw717bRU',
};

async function main() {
  // Obtener el post aprobado más reciente
  const post = await prisma.post.findFirst({
    where: {
      status: 'approved',
      tiktokPublished: false
    },
    orderBy: { approvedAt: 'desc' }
  });
  
  if (!post) {
    console.log('❌ No hay posts aprobados pendientes');
    return;
  }
  
  console.log('Post ID:', post.id);
  console.log('Caption:', post.caption?.substring(0, 50));
  console.log('Video Path:', post.videoPath);
  
  // Obtener token
  const token = await prisma.tikTokToken.findFirst({
    orderBy: { updatedAt: 'desc' }
  });
  
  if (!token) {
    console.log('❌ No hay token');
    return;
  }
  
  console.log('\n=== TOKEN INFO ===');
  console.log('Open ID:', token.openId);
  console.log('Scope:', token.scope);
  
  // 1. Probar creator info
  console.log('\n=== CREATOR INFO ===');
  const creatorRes = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    }
  });
  
  const creatorData = await creatorRes.json();
  console.log(JSON.stringify(creatorData, null, 2));
  
  // 2. Init upload con un video pequeño de prueba
  console.log('\n=== INIT UPLOAD TEST ===');
  
  // Crear un buffer de prueba mínimo (1KB de datos dummy)
  const testSize = 1024;
  
  const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({
      post_info: {
        title: 'Test title',
        privacy_level: 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: testSize,
        chunk_size: testSize,
        total_chunk_count: 1
      }
    })
  });
  
  const initData = await initRes.json();
  console.log('Init Response:');
  console.log(JSON.stringify(initData, null, 2));
  
  if (initData.error) {
    console.log('\n❌ ERROR EN INIT:');
    console.log('Code:', initData.error.code);
    console.log('Message:', initData.error.message);
    console.log('Log ID:', initData.error.log_id);
    
    // Si el error es sobre las guidelines, investigar más
    if (initData.error.message?.includes('guidelines')) {
      console.log('\n🔍 POSIBLES CAUSAS:');
      console.log('1. La cuenta @trust.app7 no está autorizada en la app live');
      console.log('2. La app no tiene los permisos correctos');
      console.log('3. La app está en modo sandbox y necesita aprobación');
      console.log('\nVerificar en TikTok Developer Portal:');
      console.log('- Status de la app: ¿Está "Live" o "Sandbox"?');
      console.log('- Target Users: ¿Está @trust.app7 agregado?');
      console.log('- Permissions: ¿Tiene video.upload y video.publish?');
    }
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
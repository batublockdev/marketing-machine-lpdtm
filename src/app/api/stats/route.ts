import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// GET - Obtener stats combinados (DB + archivos)
export async function GET() {
  // Obtener de la base de datos
  const dbStats = await prisma.stats.findMany();
  
  // Obtener de archivos JSON (si existen)
  const statsDir = path.join(process.cwd(), '../stats');
  let fileStats: any[] = [];
  
  try {
    const files = await fs.readdir(statsDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(statsDir, file), 'utf-8');
          const data = JSON.parse(content);
          
          // Flatten stats by platform
          Object.entries(data).forEach(([key, value]) => {
            if (key !== 'botId' && typeof value === 'object' && value !== null) {
              const platformData = value as any;
              fileStats.push({
                botId: data.botId || file.replace('.json', ''),
                platform: key,
                posts: platformData.posts || 0,
                views: platformData.views || 0,
                likes: platformData.likes || 0,
                shares: platformData.shares || 0,
                comments: platformData.comments || 0,
              });
            }
          });
        } catch (e) {
          // Ignorar archivos inválidos
        }
      }
    }
  } catch (e) {
    // Directorio no existe, ignorar
  }
  
  // Combinar: DB tiene prioridad, archivos son backup
  const combined: Map<string, any> = new Map();
  
  // Agregar file stats primero
  fileStats.forEach(stat => {
    const key = `${stat.botId}-${stat.platform}`;
    combined.set(key, stat);
  });
  
  // Sobrescribir con DB stats
  dbStats.forEach(stat => {
    const key = `${stat.botId}-${stat.platform}`;
    combined.set(key, {
      botId: stat.botId,
      platform: stat.platform,
      posts: stat.posts,
      views: stat.views,
      likes: stat.likes,
      shares: stat.shares,
      comments: stat.comments,
    });
  });
  
  return NextResponse.json(Array.from(combined.values()));
}

// POST - Actualizar stats (para bots)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botId, platform, posts, views, likes, shares, comments } = body;
    
    if (!botId || !platform) {
      return NextResponse.json({ error: 'botId and platform are required' }, { status: 400 });
    }
    
    const stats = await prisma.stats.upsert({
      where: { botId_platform: { botId, platform } },
      update: {
        posts: posts ?? 0,
        views: views ?? 0,
        likes: likes ?? 0,
        shares: shares ?? 0,
        comments: comments ?? 0,
        updatedAt: new Date(),
      },
      create: {
        botId,
        platform,
        posts: posts ?? 0,
        views: views ?? 0,
        likes: likes ?? 0,
        shares: shares ?? 0,
        comments: comments ?? 0,
      },
    });
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error updating stats:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
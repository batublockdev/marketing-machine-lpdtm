import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// POST - Marcar post como publicado y actualizar stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, platformPostId, url, stats } = body;
    
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }
    
    // Actualizar post en la DB
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: platformPostId || null,
        publishedUrl: url || null,
        views: stats?.views || 0,
        likes: stats?.likes || 0,
        shares: stats?.shares || 0,
        comments: stats?.comments || 0,
        statsUpdatedAt: new Date(),
      },
    });
    
    // Escribir published.json
    const postDir = path.dirname(post.videoPath);
    const publishedPath = path.join(postDir, 'published.json');
    
    await fs.writeFile(publishedPath, JSON.stringify({
      status: 'published',
      postId,
      publishedAt: new Date().toISOString(),
      platformPostId: platformPostId || null,
      url: url || null,
    }, null, 2));
    
    // Actualizar stats globales del bot/plataforma
    await prisma.stats.upsert({
      where: { botId_platform: { botId: post.botId, platform: post.platform } },
      update: {
        posts: { increment: 1 },
        views: { increment: stats?.views || 0 },
        likes: { increment: stats?.likes || 0 },
        shares: { increment: stats?.shares || 0 },
        comments: { increment: stats?.comments || 0 },
        updatedAt: new Date(),
      },
      create: {
        botId: post.botId,
        platform: post.platform,
        posts: 1,
        views: stats?.views || 0,
        likes: stats?.likes || 0,
        shares: stats?.shares || 0,
        comments: stats?.comments || 0,
      },
    });
    
    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        status: post.status,
        publishedAt: post.publishedAt,
        publishedUrl: post.publishedUrl,
      },
    });
  } catch (error) {
    console.error('Error publishing post:', error);
    return NextResponse.json({ error: 'Failed to publish post' }, { status: 500 });
  }
}

// PATCH - Actualizar stats de un post específico
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, views, likes, shares, comments } = body;
    
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }
    
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        views: views ?? undefined,
        likes: likes ?? undefined,
        shares: shares ?? undefined,
        comments: comments ?? undefined,
        statsUpdatedAt: new Date(),
      },
    });
    
    // También actualizar stats globales (diferencia)
    const diff = {
      views: views !== undefined ? views - (post.views || 0) : 0,
      likes: likes !== undefined ? likes - (post.likes || 0) : 0,
      shares: shares !== undefined ? shares - (post.shares || 0) : 0,
      comments: comments !== undefined ? comments - (post.comments || 0) : 0,
    };
    
    if (diff.views || diff.likes || diff.shares || diff.comments) {
      await prisma.stats.upsert({
        where: { botId_platform: { botId: post.botId, platform: post.platform } },
        update: {
          views: { increment: diff.views },
          likes: { increment: diff.likes },
          shares: { increment: diff.shares },
          comments: { increment: diff.comments },
          updatedAt: new Date(),
        },
        create: {
          botId: post.botId,
          platform: post.platform,
          views: views || 0,
          likes: likes || 0,
          shares: shares || 0,
          comments: comments || 0,
        },
      });
    }
    
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('Error updating post stats:', error);
    return NextResponse.json({ error: 'Failed to update post stats' }, { status: 500 });
  }
}
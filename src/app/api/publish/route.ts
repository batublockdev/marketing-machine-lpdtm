import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// POST - Marcar post listo para Instagram o confirmar publicación
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, platform } = body; // platform: 'instagram' o 'tiktok'

    if (!postId || !platform) {
      return NextResponse.json({ error: 'postId and platform are required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (platform === 'instagram') {
      // Instagram: marcar como listo para que el bot publique
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          instagramPublishReady: true,
        },
      });

      // Escribir instagram-ready.json para que el bot lo detecte
      const postDir = path.dirname(post.videoPath);
      const readyPath = path.join(postDir, 'instagram-ready.json');

      await fs.writeFile(readyPath, JSON.stringify({
        status: 'ready_for_instagram',
        postId: postId,
        targetAccount: post.targetAccount,
        readyAt: new Date().toISOString(),
      }, null, 2));

      return NextResponse.json({
        success: true,
        message: 'Post marcado como listo para Instagram',
        post: updatedPost,
      });
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error) {
    console.error('Error in publish:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// PATCH - Confirmar publicación de Instagram por el bot
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, platform, platformPostId, url } = body;

    if (!postId || !platform) {
      return NextResponse.json({ error: 'postId and platform are required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (platform === 'instagram') {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          instagramPublished: true,
          instagramPostId: platformPostId || null,
          instagramUrl: url || null,
          instagramPublishedAt: new Date(),
        },
      });

      // Actualizar archivo instagram-ready.json
      const postDir = path.dirname(post.videoPath);
      const readyPath = path.join(postDir, 'instagram-ready.json');

      await fs.writeFile(readyPath, JSON.stringify({
        status: 'published_on_instagram',
        postId: postId,
        platformPostId: platformPostId,
        url: url,
        publishedAt: new Date().toISOString(),
      }, null, 2));

      return NextResponse.json({
        success: true,
        post: updatedPost,
      });
    }

    if (platform === 'tiktok') {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          tiktokPublished: true,
          tiktokPostId: platformPostId || null,
          tiktokUrl: url || null,
          tiktokPublishedAt: new Date(),
        },
      });

      // Escribir published.json
      const postDir = path.dirname(post.videoPath);
      const publishedPath = path.join(postDir, 'published.json');

      await fs.writeFile(publishedPath, JSON.stringify({
        status: 'published_on_tiktok',
        postId: postId,
        platformPostId: platformPostId,
        url: url,
        publishedAt: new Date().toISOString(),
      }, null, 2));

      return NextResponse.json({
        success: true,
        post: updatedPost,
      });
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error) {
    console.error('Error confirming publication:', error);
    return NextResponse.json({ error: 'Failed to confirm publication' }, { status: 500 });
  }
}
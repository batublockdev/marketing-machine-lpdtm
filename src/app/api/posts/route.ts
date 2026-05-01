import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/posts - List posts by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const botId = searchParams.get('botId');
    const platform = searchParams.get('platform');

    const where: any = {};
    if (status !== 'all') {
      where.status = status;
    }
    if (botId) {
      where.botId = botId;
    }
    if (platform) {
      where.platform = platform;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/posts - Update post status/stats
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, status, platformPostId, publishedUrl, views, likes, shares, comments } = body;

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (platformPostId) updateData.platformPostId = platformPostId;
    if (publishedUrl) updateData.publishedUrl = publishedUrl;
    if (views !== undefined) updateData.views = views;
    if (likes !== undefined) updateData.likes = likes;
    if (shares !== undefined) updateData.shares = shares;
    if (comments !== undefined) updateData.comments = comments;
    
    if (status === 'published') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: updateData
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/posts - Delete post and files
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Get post to find video path
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Delete files
    const uploadDir = path.join(process.cwd(), 'uploads');
    const postDir = path.dirname(post.videoPath);
    
    if (postDir.startsWith(uploadDir) && fs.existsSync(postDir)) {
      fs.rmSync(postDir, { recursive: true, force: true });
    }

    // Delete from database
    await prisma.post.delete({
      where: { id: postId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};
    
    if (body.status) updateData.status = body.status;
    if (body.platformPostId) updateData.platformPostId = body.platformPostId;
    if (body.publishedUrl) updateData.publishedUrl = body.publishedUrl;
    if (body.views !== undefined) updateData.views = body.views;
    if (body.likes !== undefined) updateData.likes = body.likes;
    if (body.shares !== undefined) updateData.shares = body.shares;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.rejectReason !== undefined) updateData.rejectReason = body.rejectReason;
    
    if (body.status === 'approved') {
      updateData.approvedAt = new Date();
    }
    
    if (body.status === 'published') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
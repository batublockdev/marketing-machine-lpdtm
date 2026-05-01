import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/posts/[id] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;

    const post = await prisma.post.findUnique({
      where: { id: postId }
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
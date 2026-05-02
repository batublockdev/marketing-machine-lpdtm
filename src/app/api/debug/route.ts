import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/debug - Debug endpoint to see raw DB data
export async function GET() {
  try {
    const allPosts = await prisma.$queryRaw`SELECT * FROM "Post"`;
    const count = await prisma.post.count();

    return NextResponse.json({
      count,
      posts: allPosts,
      rawQuery: 'SELECT * FROM "Post"',
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
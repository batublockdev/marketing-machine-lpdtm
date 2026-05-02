import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'pending';

  let where = {};

  if (status === 'approved') {
    where = { status: 'approved' };
  } else if (status === 'pending') {
    where = { status: 'pending' };
  } else if (status === 'rejected') {
    where = { status: 'rejected' };
  } else if (status === 'published') {
    // Support both old and new schema
    where = {
      OR: [
        { status: 'published' },
        { tiktokPublished: true },
        { instagramPublished: true }
      ]
    };
  } else {
    where = { status };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(posts);
}
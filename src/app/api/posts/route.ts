import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get('status') || 'pending';

  let where: any = {};

  if (status === 'approved') {
    // Show both approved and published posts
    where = {
      OR: [
        { status: 'approved' },
        { status: 'published' },
        { tiktokPublished: true },
        { instagramPublished: true }
      ]
    };
  } else if (status === 'pending') {
    where = { status: 'pending' };
  } else if (status === 'rejected') {
    where = { status: 'rejected' };
  } else if (status === 'published') {
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

  try {
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, posts }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/rejected - Obtener posts rechazados para que los bots los corrijan
export async function GET(request: NextRequest) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers });
  }

  const botId = request.nextUrl.searchParams.get('botId');

  let where: any = { status: 'rejected' };

  if (botId) {
    where.botId = botId;
  }

  try {
    const posts = await prisma.post.findMany({
      where,
      orderBy: { rejectedAt: 'desc' },
      select: {
        id: true,
        botId: true,
        platform: true,
        targetAccount: true,
        videoPath: true,
        mediaFiles: true,
        caption: true,
        tags: true,
        rejectReason: true,
        createdAt: true,
        rejectedAt: true,
      },
    });

    return NextResponse.json({ success: true, posts }, { headers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers }
    );
  }
}
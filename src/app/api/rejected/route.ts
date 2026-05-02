import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/rejected - Obtener posts rechazados para que los bots los corrijan
export async function GET(request: NextRequest) {
  const botId = request.nextUrl.searchParams.get('botId');

  let where: any = { status: 'rejected' };

  if (botId) {
    where.botId = botId;
  }

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

  return NextResponse.json(posts);
}
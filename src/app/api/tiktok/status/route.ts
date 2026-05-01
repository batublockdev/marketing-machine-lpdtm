import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tiktok/status - Check TikTok connection status
export async function GET() {
  try {
    const tokens = await prisma.tikTokToken.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        message: 'No TikTok account connected'
      });
    }

    // Check if token needs refresh (expires in less than 1 hour)
    const tokenAge = Date.now() - tokens.updatedAt.getTime();
    const expiresInMs = tokens.expiresIn * 1000;
    const needsRefresh = tokenAge > (expiresInMs - 3600000);

    return NextResponse.json({
      connected: true,
      openId: tokens.openId,
      scope: tokens.scope,
      obtainedAt: tokens.obtainedAt,
      updatedAt: tokens.updatedAt,
      expiresAt: new Date(tokens.updatedAt.getTime() + expiresInMs),
      needsRefresh
    });
  } catch (error) {
    console.error('Error checking TikTok status:', error);
    return NextResponse.json({
      connected: false,
      error: 'Failed to check status'
    }, { status: 500 });
  }
}
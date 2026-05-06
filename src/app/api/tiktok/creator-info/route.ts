import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const TIKTOK_CONFIG = {
  client_key: process.env.TIKTOK_CLIENT_KEY || 'awc2yu9d4jywgi8h',
  client_secret: process.env.TIKTOK_CLIENT_SECRET || '2amlU7IREzZL5qAT6s4LOpiF2km7pQtV',
};

// GET /api/tiktok/creator-info - Get creator info before posting
export async function GET(request: NextRequest) {
  try {
    const token = await prisma.tikTokToken.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No TikTok account connected'
      }, { status: 401 });
    }

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    const data = await response.json();

    if (data.error?.code !== 'ok') {
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Failed to get creator info',
        details: data
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      creator: data.data
    });
  } catch (error: any) {
    console.error('Error getting creator info:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
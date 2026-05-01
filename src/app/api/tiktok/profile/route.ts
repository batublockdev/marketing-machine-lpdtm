import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tiktok/profile - Get user profile info
export async function GET(request: NextRequest) {
  try {
    // Get TikTok token from database
    const token = await prisma.tikTokToken.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No TikTok account connected. Please login first.'
      }, { status: 401 });
    }

    // Check if token needs refresh
    const tokenAge = Date.now() - token.updatedAt.getTime();
    const expiresInMs = token.expiresIn * 1000;
    
    if (tokenAge > expiresInMs - 3600000) {
      // Token needs refresh
      const refreshed = await refreshTikTokToken(token.refreshToken);
      if (!refreshed) {
        return NextResponse.json({
          success: false,
          error: 'TikTok token expired. Please login again.'
        }, { status: 401 });
      }
    }

    // Get user profile info
    const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.error?.code !== 'ok') {
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Failed to get profile info',
        details: data
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        openId: data.data?.user?.open_id,
        unionId: data.data?.user?.union_id,
        avatarUrl: data.data?.user?.avatar_url,
        displayName: data.data?.user?.display_name,
        username: data.data?.user?.username,
        bioDescription: data.data?.user?.bio_description,
        profileDeepLink: data.data?.user?.profile_deep_link,
        profileWebLink: data.data?.user?.profile_web_link,
        isVerified: data.data?.user?.is_verified
      }
    });

  } catch (error: any) {
    console.error('Error getting TikTok profile:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Helper: Refresh expired token
async function refreshTikTokToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawr4wwhktupjwwma',
        client_secret: process.env.TIKTOK_CLIENT_SECRET || '2amlU7IREzZL5qAT6s4LOpiF2km7pQtV',
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString()
    });

    const tokens = await response.json();

    if (tokens.error) {
      console.error('Token refresh failed:', tokens.error);
      return false;
    }

    await prisma.tikTokToken.updateMany({
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        updatedAt: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}
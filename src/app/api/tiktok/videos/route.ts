import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tiktok/videos - Get list of published videos with stats
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
      const refreshed = await refreshTikTokToken(token.refreshToken);
      if (!refreshed) {
        return NextResponse.json({
          success: false,
          error: 'TikTok token expired. Please login again.'
        }, { status: 401 });
      }
    }

    // Get videos from TikTok API
    // Note: video.list requires video.list scope
    const response = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=video.id,video.create_time,video.share_url,video.view_count,video.like_count,video.comment_count,video.share_count,video.title', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_count: 20
      })
    });

    const data = await response.json();

    if (data.error?.code !== 'ok') {
      // If video.list fails, return database posts instead
      const publishedPosts = await prisma.post.findMany({
        where: {
          platform: 'tiktok',
          tiktokPublished: true,
          tiktokPostId: { not: null }
        },
        orderBy: { tiktokPublishedAt: 'desc' },
        take: 50
      });

      return NextResponse.json({
        success: true,
        source: 'database',
        videos: publishedPosts.map(post => ({
          id: post.tiktokPostId,
          title: post.caption,
          share_url: post.tiktokUrl,
          create_time: post.tiktokPublishedAt?.getTime()
        }))
      });
    }

    return NextResponse.json({
      success: true,
      source: 'tiktok',
      videos: data.data?.videos || [],
      cursor: data.data?.cursor,
      has_more: data.data?.has_more
    });

  } catch (error: any) {
    console.error('Error getting TikTok videos:', error);
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
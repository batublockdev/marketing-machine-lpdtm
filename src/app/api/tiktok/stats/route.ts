import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tiktok/stats - Get user stats and post analytics
export async function GET(request: NextRequest) {
  try {
    console.log('Starting /api/tiktok/stats request...');

    // Get TikTok token from database
    const token = await prisma.tikTokToken.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    console.log('Token found:', !!token);

    if (!token) {
      console.log('No token found');
      return NextResponse.json({
        success: false,
        error: 'No TikTok account connected. Please login first.',
        needLogin: true
      }, { status: 401 });
    }

    // Check if token needs refresh
    const tokenAge = Date.now() - token.updatedAt.getTime();
    const expiresInMs = token.expiresIn * 1000;
    console.log('Token age (ms):', tokenAge, 'Expires in (ms):', expiresInMs);
    
    if (tokenAge > expiresInMs - 3600000) {
      console.log('Token needs refresh...');
      const refreshed = await refreshTikTokToken(token.refreshToken);
      if (!refreshed) {
        console.log('Token refresh failed');
        return NextResponse.json({
          success: false,
          error: 'TikTok token expired. Please login again.',
          needLogin: true
        }, { status: 401 });
      }
      console.log('Token refreshed successfully');
    }

    // Get user stats from TikTok
    console.log('Fetching user stats from TikTok API...');
    
    try {
      const response = await fetch('https://open.tiktokapis.com/v2/user/stats/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('TikTok API response status:', response.status);
      const responseText = await response.text();
      console.log('TikTok API response:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse TikTok response as JSON');
        return NextResponse.json({
          success: false,
          error: 'Invalid response from TikTok API',
          details: responseText.substring(0, 200)
        }, { status: 500 });
      }

      if (data.error?.code && data.error.code !== 'ok') {
        console.error('TikTok API error:', data.error);
        return NextResponse.json({
          success: false,
          error: data.error.message || 'Failed to get user stats',
          code: data.error.code
        }, { status: 400 });
      }

      // Get published posts from database
      const publishedPosts = await prisma.post.findMany({
        where: {
          platform: 'tiktok',
          status: 'published',
          platformPostId: { not: null }
        },
        orderBy: { publishedAt: 'desc' },
        take: 50
      });

      console.log('Found published posts:', publishedPosts.length);

      return NextResponse.json({
        success: true,
        stats: {
          followers: data.data?.user?.follower_count || 0,
          following: data.data?.user?.following_count || 0,
          likes: data.data?.user?.likes_count || 0,
          videoCount: data.data?.user?.video_count || 0
        },
        posts: publishedPosts.map(post => ({
          id: post.id,
          caption: post.caption,
          publishedUrl: post.publishedUrl,
          views: post.views,
          likes: post.likes,
          shares: post.shares,
          comments: post.comments,
          publishedAt: post.publishedAt
        }))
      });

    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to TikTok API',
        details: fetchError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in /api/tiktok/stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Helper: Refresh expired token
async function refreshTikTokToken(refreshToken: string): Promise<boolean> {
  try {
    console.log('Refreshing TikTok token...');
    
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
    console.log('Token refresh response:', tokens);

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

    console.log('Token updated in database');
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}
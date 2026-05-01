import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tiktok/stats - Get user stats and post analytics
export async function GET(request: NextRequest) {
  console.log('Starting /api/tiktok/stats request...');

  try {
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
    
    let accessToken = token.accessToken;
    
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
      // Get updated token
      const updatedToken = await prisma.tikTokToken.findFirst({
        orderBy: { updatedAt: 'desc' }
      });
      accessToken = updatedToken?.accessToken || token.accessToken;
      console.log('Token refreshed successfully');
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
      source: 'database',
      stats: {
        followers: 0,
        following: 0,
        likes: 0,
        videoCount: publishedPosts.length
      },
      posts: publishedPosts.map(post => ({
        id: post.id,
        title: post.caption,
        view_count: post.views,
        like_count: post.likes,
        comment_count: post.comments,
        share_count: post.shares,
        share_url: post.publishedUrl,
        create_time: post.publishedAt ? new Date(post.publishedAt).getTime() : null
      }))
    });

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
    console.log('Token refresh response status:', response.status);

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
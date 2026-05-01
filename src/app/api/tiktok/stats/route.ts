import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tiktok/stats - Get published posts from database
export async function GET(request: NextRequest) {
  try {
    // Get published posts from database
    const publishedPosts = await prisma.post.findMany({
      where: {
        platform: 'tiktok',
        status: 'published'
      },
      orderBy: { publishedAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      stats: {
        videoCount: publishedPosts.length
      },
      posts: publishedPosts.map(post => ({
        id: post.id,
        caption: post.caption,
        publishedUrl: post.publishedUrl,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        publishedAt: post.publishedAt
      }))
    });
  } catch (error: any) {
    console.error('Error getting stats:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
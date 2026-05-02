import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tiktok/stats - Get published posts from database
export async function GET(request: NextRequest) {
  try {
    // Get published TikTok posts from database
    const publishedPosts = await prisma.post.findMany({
      where: {
        platform: 'tiktok',
        tiktokPublished: true
      },
      orderBy: { tiktokPublishedAt: 'desc' },
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
        publishedUrl: post.tiktokUrl,
        publishedAt: post.tiktokPublishedAt
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
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const TIKTOK_CONFIG = {
  client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawr4wwhktupjwwma',
  client_secret: process.env.TIKTOK_CLIENT_SECRET || '2amlU7IREzZL5qAT6s4LOpiF2km7pQtV',
};

// POST /api/tiktok/publish - Publish a video to TikTok
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      postId,
      videoPath,
      title,
      privacyLevel,
      allowComment = false,
      allowDuet = false,
      allowStitch = false,
    } = body;

    if (!title || !privacyLevel) {
      return NextResponse.json({
        success: false,
        error: 'Title and privacyLevel are required'
      }, { status: 400 });
    }

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

    // Get video file info
    const videoFullPath = videoPath || (postId ? await getVideoPath(postId) : null);
    if (!videoFullPath) {
      return NextResponse.json({
        success: false,
        error: 'Video path not found'
      }, { status: 400 });
    }

    if (!fs.existsSync(videoFullPath)) {
      return NextResponse.json({
        success: false,
        error: 'Video file does not exist'
      }, { status: 400 });
    }

    const videoStats = fs.statSync(videoFullPath);
    if (videoStats.size === 0) {
      return NextResponse.json({
        success: false,
        error: 'Video file is empty (0 bytes)'
      }, { status: 400 });
    }

    const videoSize = videoStats.size;

    // Get creator info
    console.log('Getting creator info...');

    const creatorResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    const creatorData = await creatorResponse.json();
    console.log('Creator info:', JSON.stringify(creatorData, null, 2));

    if (creatorData.error?.code !== 'ok') {
      return NextResponse.json({
        success: false,
        error: creatorData.error?.message || 'Failed to get creator info',
        details: creatorData
      }, { status: 400 });
    }

    const allowedPrivacyLevels = creatorData.data?.privacy_level_options || [];
    if (!allowedPrivacyLevels.includes(privacyLevel)) {
      return NextResponse.json({
        success: false,
        error: `Invalid privacy level. Allowed: ${allowedPrivacyLevels.join(', ')}`,
        allowedLevels: allowedPrivacyLevels
      }, { status: 400 });
    }

    // Initialize video upload
    console.log('Initializing TikTok upload...');

    const initResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        post_info: {
          title: title,
          privacy_level: privacyLevel,
          disable_duet: !allowDuet,
          disable_comment: !allowComment,
          disable_stitch: !allowStitch,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'FILE_UPLOAD',
          video_size: videoSize,
          chunk_size: Math.min(videoSize, 10000000),
          total_chunk_count: Math.ceil(videoSize / 10000000)
        }
      })
    });

    const initData = await initResponse.json();
    console.log('Init response:', JSON.stringify(initData, null, 2));

    if (initData.error?.code !== 'ok') {
      return NextResponse.json({
        success: false,
        error: initData.error?.message || 'Failed to initialize upload',
        details: initData
      }, { status: 400 });
    }

    const { publish_id, upload_url } = initData.data;

    // Upload the video
    console.log('Uploading video to TikTok...');

    const videoBuffer = fs.readFileSync(videoFullPath);

    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`
      },
      body: videoBuffer
    });

    console.log('Upload status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      const uploadText = await uploadResponse.text();
      return NextResponse.json({
        success: false,
        error: 'Failed to upload video',
        details: uploadText
      }, { status: 500 });
    }

    // Check status
    console.log('Checking publish status...');

    const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({ publish_id })
    });

    const statusData = await statusResponse.json();
    console.log('Status response:', JSON.stringify(statusData, null, 2));

    // Update post in database
    if (postId) {
      const tiktokUrl = `https://www.tiktok.com/@${token.openId}/video/${publish_id}`;

      await prisma.post.update({
        where: { id: postId },
        data: {
          tiktokPublished: true,
          tiktokPostId: publish_id,
          tiktokUrl: tiktokUrl,
          tiktokPublishedAt: new Date(),
        }
      });

      // Write published.json
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (post) {
        const postDir = path.dirname(post.videoPath);
        const publishedPath = path.join(postDir, 'published.json');

        await fs.promises.writeFile(publishedPath, JSON.stringify({
          status: 'published_on_tiktok',
          postId: postId,
          platformPostId: publish_id,
          url: tiktokUrl,
          publishedAt: new Date().toISOString(),
        }, null, 2));
      }
    }

    return NextResponse.json({
      success: true,
      publish_id,
      status: statusData.data?.status || 'PROCESSING',
      message: 'Video uploaded successfully. It may take a few minutes to appear on your profile.',
      creator_info: creatorData.data
    });

  } catch (error: any) {
    console.error('Error publishing to TikTok:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/tiktok/publish - Check publish status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publishId = searchParams.get('publish_id');

  if (!publishId) {
    return NextResponse.json({
      error: 'publish_id is required'
    }, { status: 400 });
  }

  const token = await prisma.tikTokToken.findFirst({
    orderBy: { updatedAt: 'desc' }
  });

  if (!token) {
    return NextResponse.json({
      error: 'No TikTok account connected'
    }, { status: 401 });
  }

  const statusResponse = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8'
    },
    body: JSON.stringify({ publish_id: publishId })
  });

  const statusData = await statusResponse.json();

  return NextResponse.json(statusData);
}

async function refreshTikTokToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CONFIG.client_key,
        client_secret: TIKTOK_CONFIG.client_secret,
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

async function getVideoPath(postId: string): Promise<string | null> {
  const post = await prisma.post.findUnique({
    where: { id: postId }
  });
  return post?.videoPath || null;
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';



// POST /api/posts/upload - Upload media from bots
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const botId = formData.get('botId') as string;
    const platform = formData.get('platform') as string;
    const caption = formData.get('caption') as string;
    const tags = formData.get('tags') as string; // JSON array string
    const mediaFiles = formData.getAll('media') as File[];

    if (!botId || !platform || mediaFiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: botId, platform, and at least one media file'
      }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', botId, platform);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate post ID
    const postId = randomUUID();
    const postDir = path.join(uploadDir, postId);
    if (!fs.existsSync(postDir)) {
      fs.mkdirSync(postDir, { recursive: true });
    }

    // Save media files
    const savedPaths: string[] = [];
    for (const file of mediaFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const ext = file.name.split('.').pop() || 'bin';
      const filename = `media-${savedPaths.length + 1}.${ext}`;
      const filepath = path.join(postDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      savedPaths.push(filepath);
    }

    // Use first file as primary video path
    const videoPath = savedPaths[0];
    const mediaFilesJson = savedPaths.length > 1 ? JSON.stringify(savedPaths) : null;

    // Save to database
    const post = await prisma.post.create({
      data: {
        id: postId,
        botId,
        platform,
        videoPath,
        mediaFiles: mediaFilesJson,
        caption: caption || null,
        tags: tags || null,
        status: 'pending'
      }
    });

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        botId: post.botId,
        platform: post.platform,
        caption: post.caption,
        tags: post.tags ? JSON.parse(post.tags) : [],
        status: post.status,
        createdAt: post.createdAt
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error uploading post:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
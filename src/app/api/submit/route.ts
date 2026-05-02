import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// POST /api/submit - Enviar nuevo post desde un bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      botId,
      platform,           // "tiktok" o "instagram"
      targetAccount,       // Cuenta destino (ej: "@mi_cuenta")
      videoPath,
      mediaFiles,          // Array de paths para carruseles
      caption,
      tags,
    } = body;

    if (!botId || !platform || !videoPath) {
      return NextResponse.json({
        success: false,
        error: 'botId, platform, and videoPath are required'
      }, { status: 400, headers: corsHeaders });
    }

    // Crear el post en la DB
    const post = await prisma.post.create({
      data: {
        botId,
        platform,
        targetAccount: targetAccount || null,
        videoPath,
        mediaFiles: mediaFiles ? JSON.stringify(mediaFiles) : null,
        caption: caption || null,
        tags: tags ? JSON.stringify(tags) : null,
        status: 'pending',
      },
    });

    // Escribir meta.json en la carpeta del post (si el directorio existe)
    try {
      const postDir = path.dirname(videoPath);
      const metaPath = path.join(postDir, 'meta.json');

      await fs.writeFile(metaPath, JSON.stringify({
        botId,
        platform,
        targetAccount: targetAccount || null,
        caption: caption || null,
        tags: tags || [],
        mediaFiles: mediaFiles || [videoPath],
        postId: post.id,
        createdAt: post.createdAt.toISOString(),
      }, null, 2));
    } catch (writeError) {
      // Ignore write errors - the post is already in the DB
      console.log('Could not write meta.json:', writeError);
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        botId: post.botId,
        platform: post.platform,
        targetAccount: post.targetAccount,
        status: post.status,
      },
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Error submitting post:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to submit post'
    }, { status: 500, headers: corsHeaders });
  }
}
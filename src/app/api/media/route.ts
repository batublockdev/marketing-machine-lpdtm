import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// GET /api/media?path=/app/uploads/... - Serve media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaPath = searchParams.get('path');

    if (!mediaPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Security: only allow files from uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const resolvedPath = path.resolve(mediaPath);
    
    if (!resolvedPath.startsWith(uploadsDir) && !resolvedPath.startsWith('/app/uploads')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(resolvedPath);
    const ext = resolvedPath.split('.').pop()?.toLowerCase() || 'bin';
    
    // Determine content type
    const contentTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Error serving media:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
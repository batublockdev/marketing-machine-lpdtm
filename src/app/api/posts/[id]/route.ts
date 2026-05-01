import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, rejectReason } = body;

  const post = await prisma.post.update({
    where: { id },
    data: {
      status,
      rejectReason: status === 'rejected' ? rejectReason : null,
      approvedAt: status === 'approved' ? new Date() : null,
    },
  });

  // Write response.json for bot to detect
  if (status === 'approved' || status === 'rejected') {
    const dir = path.dirname(post.videoPath);
    const responsePath = path.join(dir, 'response.json');
    await fs.writeFile(responsePath, JSON.stringify({
      status,
      postId: post.id,
      approvedAt: post.approvedAt,
      rejectReason: post.rejectReason,
    }, null, 2));
    
    // Move to approved/rejected folder
    const statusDir = status === 'approved' ? 'approved' : 'rejected';
    const targetDir = path.join(dir, '../../..', statusDir, post.botId, post.platform);
    await fs.mkdir(targetDir, { recursive: true });
  }

  return NextResponse.json(post);
}
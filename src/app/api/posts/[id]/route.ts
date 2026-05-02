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
      rejectedAt: status === 'rejected' ? new Date() : null,
    },
  });

  // Write response.json for bot to detect
  const dir = path.dirname(post.videoPath);
  const responsePath = path.join(dir, 'response.json');

  await fs.writeFile(responsePath, JSON.stringify({
    status,
    postId: post.id,
    approvedAt: post.approvedAt,
    rejectedAt: post.rejectedAt,
    rejectReason: post.rejectReason,
  }, null, 2));

  return NextResponse.json(post);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const post = await prisma.post.delete({
    where: { id },
  });

  // Delete files
  try {
    const dir = path.dirname(post.videoPath);
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error deleting post files:', error);
  }

  return NextResponse.json({ success: true });
}
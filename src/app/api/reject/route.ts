import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/reject - Reject a post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, reason } = body;

    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'postId is required' 
      }, { status: 400 });
    }

    // Update post status to rejected
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        status: 'rejected',
        rejectReason: reason || null
      }
    });

    return NextResponse.json({ 
      success: true, 
      post 
    });
  } catch (error: any) {
    console.error('Error rejecting post:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';



// DELETE /api/tiktok/disconnect - Disconnect TikTok account
export async function DELETE() {
  try {
    await prisma.tikTokToken.deleteMany();
    
    return NextResponse.json({
      success: true,
      message: 'TikTok account disconnected'
    });
  } catch (error) {
    console.error('Error disconnecting TikTok:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to disconnect'
    }, { status: 500 });
  }
}
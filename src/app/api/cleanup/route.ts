import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// POST /api/cleanup - Clean old media files (48h after approval/rejection)
// This should be called by a cron job every hour
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (optional: add API key)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    const now = new Date();
    const hours48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let deletedFiles = 0;
    let deletedPosts = 0;
    let freedSpace = 0;

    // Get posts approved/rejected/published more than 48 hours ago
    const oldPosts = await prisma.post.findMany({
      where: {
        OR: [
          {
            status: { in: ['approved', 'rejected', 'published'] },
            OR: [
              { approvedAt: { lt: hours48Ago } },
              { publishedAt: { lt: hours48Ago } }
            ]
          },
          {
            status: 'pending',
            createdAt: { lt: days7Ago }
          }
        ]
      }
    });

    for (const post of oldPosts) {
      // Delete files
      const postDir = path.dirname(post.videoPath);
      
      if (postDir.startsWith(uploadDir) && fs.existsSync(postDir)) {
        try {
          const files = fs.readdirSync(postDir);
          for (const file of files) {
            const filePath = path.join(postDir, file);
            const stats = fs.statSync(filePath);
            freedSpace += stats.size;
            fs.unlinkSync(filePath);
            deletedFiles++;
          }
          
          // Try to remove empty directory
          try {
            fs.rmdirSync(postDir);
          } catch {
            // Directory not empty, ignore
          }
        } catch (error) {
          console.error(`Error deleting files for post ${post.id}:`, error);
        }
      }

      // Delete pending posts (7+ days old) from database
      if (post.status === 'pending') {
        await prisma.post.delete({
          where: { id: post.id }
        });
        deletedPosts++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        filesDeleted: deletedFiles,
        postsDeleted: deletedPosts,
        spaceFreedMB: Math.round(freedSpace / 1024 / 1024 * 100) / 100
      }
    });
  } catch (error: any) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
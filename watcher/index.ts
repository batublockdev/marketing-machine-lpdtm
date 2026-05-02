import chokidar from 'chokidar';
import fs from 'fs/promises';
import path from 'path';
import prisma from '../src/lib/db';
import 'dotenv/config';

const INBOX_DIR = path.resolve(process.cwd(), '../inbox');

async function processMetaFile(metaPath: string) {
  try {
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaContent);

    const dir = path.dirname(metaPath);
    const parts = dir.split(path.sep);

    // Extract botId and platform from path: inbox/bot-1/tiktok/post-001
    const botIndex = parts.indexOf('inbox') + 1;
    const botId = parts[botIndex] || 'unknown';
    const platform = parts[botIndex + 1] || 'unknown';

    // Find all media files in directory
    const files = await fs.readdir(dir);
    const mediaFiles = files.filter(f =>
      f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm') ||
      f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.webp') ||
      f.endsWith('.gif')
    );

    if (mediaFiles.length === 0) {
      console.log(`No media found in ${dir}`);
      return;
    }

    // Find primary file (video first, then first image)
    const primaryFile = mediaFiles.find(f =>
      f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.webm')
    ) || mediaFiles[0];

    // Check if post already exists
    const existing = await prisma.post.findFirst({
      where: { videoPath: path.join(dir, primaryFile) }
    });

    if (existing) {
      console.log(`Post already exists: ${existing.id}`);
      // Check for response.json and published.json to update status
      await checkAndUpdateStatus(dir, existing.id);
      return;
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        botId,
        platform,
        targetAccount: meta.targetAccount || null,
        videoPath: path.join(dir, primaryFile),
        mediaFiles: mediaFiles.length > 1 ? JSON.stringify(mediaFiles.map(f => path.join(dir, f))) : null,
        caption: meta.caption || null,
        tags: meta.tags ? JSON.stringify(meta.tags) : null,
        status: 'pending',
      }
    });

    console.log(`✓ Created post: ${post.id} from ${botId}/${platform} (${mediaFiles.length} files)`);

    // Check for existing response.json and published.json
    await checkAndUpdateStatus(dir, post.id);

  } catch (error) {
    console.error(`Error processing ${metaPath}:`, error);
  }
}

async function checkAndUpdateStatus(dir: string, postId: string) {
  try {
    const files = await fs.readdir(dir);

    // Check for instagram-ready.json
    if (files.includes('instagram-ready.json')) {
      const readyPath = path.join(dir, 'instagram-ready.json');
      const content = await fs.readFile(readyPath, 'utf-8');
      const ready = JSON.parse(content);

      if (ready.status === 'published_on_instagram') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            instagramPublished: true,
            instagramPostId: ready.platformPostId || null,
            instagramUrl: ready.url || null,
            instagramPublishedAt: new Date(ready.publishedAt || new Date()),
          }
        });
        console.log(`✓ Updated post ${postId} as published on Instagram`);
        return;
      } else if (ready.status === 'ready_for_instagram') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            instagramPublishReady: true,
          }
        });
        console.log(`✓ Updated post ${postId} as ready for Instagram`);
        return;
      }
    }

    // Check for published.json (TikTok)
    if (files.includes('published.json')) {
      const publishedPath = path.join(dir, 'published.json');
      const content = await fs.readFile(publishedPath, 'utf-8');
      const published = JSON.parse(content);

      if (published.status === 'published_on_tiktok') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            tiktokPublished: true,
            tiktokPostId: published.platformPostId || null,
            tiktokUrl: published.url || null,
            tiktokPublishedAt: new Date(published.publishedAt || new Date()),
          }
        });
        console.log(`✓ Updated post ${postId} as published on TikTok`);
        return;
      }
    }

    // Check for response.json
    if (files.includes('response.json')) {
      const responsePath = path.join(dir, 'response.json');
      const content = await fs.readFile(responsePath, 'utf-8');
      const response = JSON.parse(content);

      if (response.status === 'approved') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: 'approved',
            approvedAt: new Date(response.approvedAt || new Date()),
          }
        });
        console.log(`✓ Updated post ${postId} to approved`);
      } else if (response.status === 'rejected') {
        await prisma.post.update({
          where: { id: postId },
          data: {
            status: 'rejected',
            rejectReason: response.rejectReason || null,
            rejectedAt: new Date(response.rejectedAt || new Date()),
          }
        });
        console.log(`✓ Updated post ${postId} to rejected`);
      }
    }
  } catch (error) {
    console.error(`Error checking status for ${postId}:`, error);
  }
}

async function processResponseFile(responsePath: string) {
  try {
    const dir = path.dirname(responsePath);
    const content = await fs.readFile(responsePath, 'utf-8');
    const response = JSON.parse(content);

    // Find post by directory
    const posts = await prisma.post.findMany({
      where: { videoPath: { contains: dir } }
    });

    if (posts.length === 0) {
      console.log(`No post found for ${dir}`);
      return;
    }

    const post = posts[0];

    if (response.status === 'approved') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'approved',
          approvedAt: new Date(response.approvedAt || new Date()),
        }
      });
      console.log(`✓ Post ${post.id} marked as approved`);
    } else if (response.status === 'rejected') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'rejected',
          rejectReason: response.rejectReason || null,
          rejectedAt: new Date(response.rejectedAt || new Date()),
        }
      });
      console.log(`✓ Post ${post.id} marked as rejected`);
    }
  } catch (error) {
    console.error(`Error processing ${responsePath}:`, error);
  }
}

async function processPublishedFile(publishedPath: string) {
  try {
    const dir = path.dirname(publishedPath);
    const content = await fs.readFile(publishedPath, 'utf-8');
    const published = JSON.parse(content);

    // Find post by directory
    const posts = await prisma.post.findMany({
      where: { videoPath: { contains: dir } }
    });

    if (posts.length === 0) {
      console.log(`No post found for ${dir}`);
      return;
    }

    const post = posts[0];

    if (published.status === 'published_on_tiktok') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          tiktokPublished: true,
          tiktokPostId: published.platformPostId || null,
          tiktokUrl: published.url || null,
          tiktokPublishedAt: new Date(published.publishedAt || new Date()),
        }
      });
      console.log(`✓ Post ${post.id} marked as published on TikTok: ${published.url}`);
    } else if (published.status === 'published_on_instagram') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          instagramPublished: true,
          instagramPostId: published.platformPostId || null,
          instagramUrl: published.url || null,
          instagramPublishedAt: new Date(published.publishedAt || new Date()),
        }
      });
      console.log(`✓ Post ${post.id} marked as published on Instagram: ${published.url}`);
    }
  } catch (error) {
    console.error(`Error processing ${publishedPath}:`, error);
  }
}

async function processInstagramReadyFile(readyPath: string) {
  try {
    const dir = path.dirname(readyPath);
    const content = await fs.readFile(readyPath, 'utf-8');
    const ready = JSON.parse(content);

    // Find post by directory
    const posts = await prisma.post.findMany({
      where: { videoPath: { contains: dir } }
    });

    if (posts.length === 0) {
      console.log(`No post found for ${dir}`);
      return;
    }

    const post = posts[0];

    if (ready.status === 'ready_for_instagram') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          instagramPublishReady: true,
        }
      });
      console.log(`✓ Post ${post.id} marked as ready for Instagram`);
    } else if (ready.status === 'published_on_instagram') {
      await prisma.post.update({
        where: { id: post.id },
        data: {
          instagramPublished: true,
          instagramPostId: ready.platformPostId || null,
          instagramUrl: ready.url || null,
          instagramPublishedAt: new Date(ready.publishedAt || new Date()),
        }
      });
      console.log(`✓ Post ${post.id} marked as published on Instagram: ${ready.url}`);
    }
  } catch (error) {
    console.error(`Error processing ${readyPath}:`, error);
  }
}

async function scanExistingFiles() {
  console.log('Scanning existing files...');

  async function scanDir(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.name === 'meta.json') {
          console.log(`Found: ${fullPath}`);
          await processMetaFile(fullPath);
        }
      }
    } catch (err) {
      // Directory might not exist yet
      console.log(`Skipping ${dir}: ${err}`);
    }
  }

  try {
    await scanDir(INBOX_DIR);
    console.log('Initial scan complete.');
  } catch (err) {
    console.error('Scan error:', err);
  }
}

// Watch for meta.json files
const metaWatcher = chokidar.watch(`${INBOX_DIR}/**/meta.json`, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 1000,
    pollInterval: 100
  }
});

metaWatcher
  .on('add', (filePath) => {
    console.log(`📄 New meta.json: ${filePath}`);
    processMetaFile(filePath);
  })
  .on('change', (filePath) => {
    console.log(`📝 Meta.json changed: ${filePath}`);
    processMetaFile(filePath);
  })
  .on('error', (error) => {
    console.error(`Watcher error:`, error);
  });

// Watch for response.json files
const responseWatcher = chokidar.watch(`${INBOX_DIR}/**/response.json`, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

responseWatcher
  .on('add', (filePath) => {
    console.log(`✅ New response.json: ${filePath}`);
    processResponseFile(filePath);
  })
  .on('change', (filePath) => {
    console.log(`📝 Response.json changed: ${filePath}`);
    processResponseFile(filePath);
  });

// Watch for published.json files
const publishedWatcher = chokidar.watch(`${INBOX_DIR}/**/published.json`, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

publishedWatcher
  .on('add', (filePath) => {
    console.log(`🚀 New published.json: ${filePath}`);
    processPublishedFile(filePath);
  })
  .on('change', (filePath) => {
    console.log(`📝 Published.json changed: ${filePath}`);
    processPublishedFile(filePath);
  });

// Watch for instagram-ready.json files
const instagramReadyWatcher = chokidar.watch(`${INBOX_DIR}/**/instagram-ready.json`, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100
  }
});

instagramReadyWatcher
  .on('add', (filePath) => {
    console.log(`📸 New instagram-ready.json: ${filePath}`);
    processInstagramReadyFile(filePath);
  })
  .on('change', (filePath) => {
    console.log(`📝 Instagram-ready.json changed: ${filePath}`);
    processInstagramReadyFile(filePath);
  });

// Watch for new directories (new bots)
const dirWatcher = chokidar.watch(INBOX_DIR, {
  ignored: /(^|[\/\\])\../,
  persistent: true,
  ignoreInitial: true,
  depth: 2,
});

dirWatcher
  .on('addDir', (dirPath) => {
    const parts = dirPath.split(path.sep);
    const relativeParts = parts.slice(parts.indexOf('inbox') + 1);

    // If path is inbox/bot-x/platform/post-y, scan for meta.json
    if (relativeParts.length === 3) {
      const metaPath = path.join(dirPath, 'meta.json');
      console.log(`📁 New post directory: ${dirPath}`);
      setTimeout(() => {
        if (require('fs').existsSync(metaPath)) {
          console.log(`Found meta.json in new dir: ${metaPath}`);
          processMetaFile(metaPath);
        }
      }, 500);
    }
  });

console.log('🚀 Starting watcher...');
scanExistingFiles().then(() => {
  console.log(`👀 Watching ${INBOX_DIR} for new posts...`);
});
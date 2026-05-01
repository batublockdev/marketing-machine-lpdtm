/**
 * BOT CLIENT EXAMPLE
 * 
 * Este archivo muestra cómo un bot debe interactuar con la plataforma.
 * Los bots pueden usar este código como referencia.
 */

import fs from 'fs';
import path from 'path';

const PLATFORM_BASE = '/path/to/marketing-machine-lpdtm/inbox';

export class BotClient {
  private botId: string;

  constructor(botId: string) {
    this.botId = botId;
  }

  /**
   * Enviar contenido nuevo
   */
  async submitContent(platform: 'tiktok' | 'instagram', content: {
    mediaPath: string;        // Ruta al video o imagen
    caption: string;
    tags: string[];
    scheduledTime?: Date;
  }): Promise<string> {
    // Crear carpeta única para el post
    const postId = `post-${Date.now()}`;
    const postDir = path.join(PLATFORM_BASE, this.botId, platform, postId);
    
    fs.mkdirSync(postDir, { recursive: true });

    // Copiar archivo de media
    const mediaExt = path.extname(content.mediaPath);
    const targetMediaName = mediaExt === '.mp4' || mediaExt === '.mov' 
      ? 'video.mp4' 
      : 'image' + mediaExt;
    
    fs.copyFileSync(content.mediaPath, path.join(postDir, targetMediaName));

    // Escribir metadata
    const meta = {
      caption: content.caption,
      tags: content.tags,
      scheduled_time: content.scheduledTime?.toISOString() || null,
    };
    
    fs.writeFileSync(
      path.join(postDir, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );

    console.log(`✓ Content submitted: ${postDir}`);
    return postId;
  }

  /**
   * Enviar carrusel (múltiples imágenes)
   */
  async submitCarousel(platform: 'tiktok' | 'instagram', content: {
    mediaPaths: string[];      // Array de imágenes
    caption: string;
    tags: string[];
  }): Promise<string> {
    const postId = `post-${Date.now()}`;
    const postDir = path.join(PLATFORM_BASE, this.botId, platform, postId);
    
    fs.mkdirSync(postDir, { recursive: true });

    // Copiar cada imagen
    content.mediaPaths.forEach((mediaPath, index) => {
      const ext = path.extname(mediaPath);
      fs.copyFileSync(mediaPath, path.join(postDir, `image${index + 1}${ext}`));
    });

    // Escribir metadata
    const meta = {
      caption: content.caption,
      tags: content.tags,
      type: 'carousel',
      mediaCount: content.mediaPaths.length,
    };
    
    fs.writeFileSync(
      path.join(postDir, 'meta.json'),
      JSON.stringify(meta, null, 2)
    );

    return postId;
  }

  /**
   * Verificar si hay respuesta (aprobado/rechazado)
   */
  async checkResponse(postId: string, platform: 'tiktok' | 'instagram'): Promise<{
    status: 'pending' | 'approved' | 'rejected';
    rejectReason?: string;
  } | null> {
    const responsePath = path.join(
      PLATFORM_BASE, 
      this.botId, 
      platform, 
      postId, 
      'response.json'
    );

    if (!fs.existsSync(responsePath)) {
      return null; // Sin respuesta aún
    }

    const response = JSON.parse(fs.readFileSync(responsePath, 'utf-8'));
    return response;
  }

  /**
   * Marcar como publicado
   */
  async markPublished(postId: string, platform: 'tiktok' | 'instagram', data: {
    platformPostId: string;
    url: string;
  }): Promise<void> {
    const postDir = path.join(PLATFORM_BASE, this.botId, platform, postId);
    
    const publishedData = {
      status: 'published',
      postId: postId,
      publishedAt: new Date().toISOString(),
      platformPostId: data.platformPostId,
      url: data.url,
    };

    fs.writeFileSync(
      path.join(postDir, 'published.json'),
      JSON.stringify(publishedData, null, 2)
    );
  }

  /**
   * Actualizar estadísticas
   */
  async updateStats(platform: 'tiktok' | 'instagram', stats: {
    posts: number;
    views: number;
    likes: number;
    shares: number;
    comments: number;
  }): Promise<void> {
    const statsPath = path.join(PLATFORM_BASE, '..', 'stats', `${this.botId}.json`);
    
    let existingStats: any = {};
    
    if (fs.existsSync(statsPath)) {
      existingStats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }

    existingStats.botId = this.botId;
    existingStats[platform] = stats;

    fs.writeFileSync(statsPath, JSON.stringify(existingStats, null, 2));
    console.log(`✓ Stats updated for ${this.botId}/${platform}`);
  }

  /**
   * Monitorear posts pendientes de aprobación
   */
  async waitForApproval(postId: string, platform: 'tiktok' | 'instagram', timeout = 3600000): Promise<{
    status: 'approved' | 'rejected' | 'timeout';
    rejectReason?: string;
  }> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await this.checkResponse(postId, platform);
      
      if (response) {
        if (response.status === 'approved') {
          return { status: 'approved' };
        } else if (response.status === 'rejected') {
          return { 
            status: 'rejected', 
            rejectReason: response.rejectReason 
          };
        }
      }

      // Esperar 10 segundos antes de volver a verificar
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    return { status: 'timeout' };
  }
}

// Ejemplo de uso:
/*
const bot = new BotClient('bot-1');

// Enviar contenido
const postId = await bot.submitContent('tiktok', {
  mediaPath: './video.mp4',
  caption: 'Mi video increíble! #viral',
  tags: ['viral', 'trending'],
});

// Esperar aprobación
const result = await bot.waitForApproval(postId, 'tiktok');

if (result.status === 'approved') {
  // Publicar en TikTok
  const publishResult = await publishToTikTok(videoPath, caption);
  
  // Marcar como publicado
  await bot.markPublished(postId, 'tiktok', {
    platformPostId: publishResult.id,
    url: publishResult.url,
  });

  // Actualizar stats
  await bot.updateStats('tiktok', {
    posts: 15,
    views: 125000,
    likes: 8500,
    shares: 320,
    comments: 450,
  });
} else if (result.status === 'rejected') {
  console.log(`Rechazado: ${result.rejectReason}`);
  // Regenerar contenido basado en la razón
}
*/
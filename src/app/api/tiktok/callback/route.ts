import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TIKTOK_CONFIG = {
  client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawr4wwhktupjwwma',
  client_secret: process.env.TIKTOK_CLIENT_SECRET || '2amlU7IREzZL5qAT6s4LOpiF2km7pQtV',
  redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://timer-silence-foto-thomson.trycloudflare.com/api/tiktok/callback',
};

// GET /api/tiktok/callback - Handle OAuth callback
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Log for debugging
  console.log('=== TIKTOK CALLBACK ===');
  console.log('Code:', code ? 'received' : 'missing');
  console.log('State:', state);
  console.log('Error:', error);
  console.log('======================');

  if (error) {
    const errorHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>TikTok Auth Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #1a1a2e; color: white; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #ff4444; }
            .error-box { background: #2a2a4e; border: 1px solid #ff4444; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .btn { display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn:hover { background: #00cc6a; }
            a { color: #00ff88; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error de Autorización</h1>
            <div class="error-box">
              <p><strong>Error:</strong> ${error}</p>
              <p><strong>Descripción:</strong> ${errorDescription || 'N/A'}</p>
            </div>
            <h3>Posibles soluciones:</h3>
            <ul>
              <li>Tu cuenta de TikTok debe estar agregada como <strong>Target User</strong> en el sandbox</li>
              <li>Ve a <a href="https://developers.tiktok.com/apps" target="_blank">TikTok Developers</a></li>
              <li>Abre tu app → Sandbox → Target Users → Agrega tu cuenta</li>
            </ul>
            <a href="/" class="btn">← Volver al Dashboard</a>
          </div>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, { 
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  if (!code) {
    const noCodeHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>No Code</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #1a1a2e; color: white; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #ffaa00; }
            .btn { display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ No se recibió código de autorización</h1>
            <p>Posiblemente cancelaste la autorización o hubo un problema con la sesión.</p>
            <a href="/" class="btn">← Volver al Dashboard</a>
          </div>
        </body>
      </html>
    `;
    return new NextResponse(noCodeHtml, { 
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Exchange code for tokens
  try {
    console.log('Exchanging code for tokens...');
    
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_key: TIKTOK_CONFIG.client_key,
        client_secret: TIKTOK_CONFIG.client_secret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_CONFIG.redirect_uri
      }).toString()
    });

    const tokens = await tokenResponse.json();
    console.log('Token response:', JSON.stringify(tokens, null, 2));

    if (tokens.error) {
      const errorHtml = `
        <html>
          <head><meta charset="utf-8"><title>Token Error</title></head>
          <body style="font-family: Arial; padding: 40px; background: #1a1a2e; color: white;">
            <h1>❌ Error al obtener token</h1>
            <p><strong>Error:</strong> ${tokens.error}</p>
            <p><strong>Descripción:</strong> ${tokens.error_description || 'N/A'}</p>
            <pre style="background: #2a2a4e; padding: 10px; border-radius: 8px; overflow-x: auto;">${JSON.stringify(tokens, null, 2)}</pre>
            <a href="/" style="display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">← Volver al Dashboard</a>
          </body>
        </html>
      `;
      return new NextResponse(errorHtml, { 
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Save tokens to database
    await prisma.tikTokToken.upsert({
      where: { openId: tokens.open_id },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope,
        updatedAt: new Date()
      },
      create: {
        openId: tokens.open_id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        scope: tokens.scope
      }
    });

    console.log('✅ Tokens saved to database for openId:', tokens.open_id);

    const successHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>TikTok Connected</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; background: #1a1a2e; color: white; }
            .container { max-width: 600px; margin: 0 auto; text-align: center; }
            h1 { color: #00ff88; font-size: 2em; }
            .success-box { background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%); color: #1a1a2e; padding: 30px; border-radius: 12px; margin: 20px 0; }
            .info { background: #2a2a4e; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left; }
            .btn { display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
            .btn:hover { background: #00cc6a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-box">
              <h1>✅ TikTok Conectado!</h1>
            </div>
            <div class="info">
              <p><strong>Open ID:</strong> ${tokens.open_id}</p>
              <p><strong>Scope:</strong> ${tokens.scope}</p>
              <p><strong>Expires in:</strong> ${Math.floor(tokens.expires_in / 3600)} horas</p>
            </div>
            <p>Tus credenciales están guardadas en el servidor.</p>
            <p>Ya puedes publicar contenido en TikTok!</p>
            <a href="/" class="btn">← Volver al Dashboard</a>
          </div>
        </body>
      </html>
    `;
    
    return new NextResponse(successHtml, { 
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err: any) {
    console.error('Error exchanging tokens:', err);
    const errorHtml = `
      <html>
        <head><meta charset="utf-8"><title>Error</title></head>
        <body style="font-family: Arial; padding: 40px; background: #1a1a2e; color: white;">
          <h1>❌ Error de Conexión</h1>
          <p>${err.message}</p>
          <pre style="background: #2a2a4e; padding: 10px; border-radius: 8px; overflow-x: auto;">${err.stack}</pre>
          <a href="/" style="display: inline-block; background: #00ff88; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">← Volver al Dashboard</a>
        </body>
      </html>
    `;
    return new NextResponse(errorHtml, { 
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
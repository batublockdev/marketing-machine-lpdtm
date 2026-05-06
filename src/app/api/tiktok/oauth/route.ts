import { NextRequest, NextResponse } from 'next/server';

// TikTok OAuth configuration
const TIKTOK_CONFIG = {
  client_key: process.env.TIKTOK_CLIENT_KEY || 'awc2yu9d4jywgi8h',
  client_secret: process.env.TIKTOK_CLIENT_SECRET || 'lKW0Zu1zDOpnifeSuDUjd6MPlw717bRU',
  redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://marketing-machine-lpdtm-production.up.railway.app/api/tiktok/callback',
  // Scopes for Content Posting API
  // video.upload = upload as draft
  // video.publish = direct post (requires Direct Post enabled)
  scope: 'user.info.basic,video.upload,video.publish'
};

// GET /api/tiktok/oauth - Start OAuth flow (redirect to TikTok)
export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();

  // Build authorization URL
  const params = new URLSearchParams({
    client_key: TIKTOK_CONFIG.client_key,
    scope: TIKTOK_CONFIG.scope,
    response_type: 'code',
    redirect_uri: TIKTOK_CONFIG.redirect_uri,
    state: state
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

  // Redirect directly to TikTok
  return NextResponse.redirect(authUrl);
}

export { TIKTOK_CONFIG };
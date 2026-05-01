import { NextRequest, NextResponse } from 'next/server';

// TikTok OAuth configuration
const TIKTOK_CONFIG = {
  client_key: process.env.TIKTOK_CLIENT_KEY || 'sbawr4wwhktupjwwma',
  client_secret: process.env.TIKTOK_CLIENT_SECRET || '2amlU7IREzZL5qAT6s4LOpiF2km7pQtV',
  redirect_uri: process.env.TIKTOK_REDIRECT_URI || 'https://marketing-machine-lpdtm-production.up.railway.app/api/tiktok/callback',
  // Scopes for Content Posting API and Profile Stats
  // user.info.basic - basic profile info
  // user.info.profile - profile links and bio
  // user.info.stats - follower count, likes, video count
  // video.upload - upload videos as draft
  // video.publish - publish videos directly
  scope: 'user.info.basic,user.info.profile,user.info.stats,video.upload,video.publish'
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
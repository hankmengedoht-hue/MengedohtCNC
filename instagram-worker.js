/**
 * Mengedoht CNC — Instagram Feed Worker
 * ======================================
 * Serves your recent Instagram posts as JSON so the site can show them
 * directly — using Instagram's own API, not a paid third-party widget.
 * Free forever (Meta doesn't charge for this), and the access token
 * refreshes itself automatically so you never have to touch it again
 * once it's set up.
 *
 * This uses "Instagram API with Instagram Login" — Meta's newer, simpler
 * path made for exactly this (a business fetching its own posts). It does
 * NOT require a Facebook Page.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ONE-TIME SETUP — steps only you can do (they need your own logins)
 * ───────────────────────────────────────────────────────────────────────
 *
 * 1. Make sure @mengedohtcnc is a Professional account:
 *      Instagram app → Settings → Account type and tools →
 *      Switch to Professional Account → choose Business or Creator.
 *
 * 2. Create a Meta developer app:
 *      Go to https://developers.facebook.com/apps → "Create App".
 *      Any app type that lets you add products is fine (e.g. "Other" / "Business").
 *
 * 3. Add the Instagram product to the app:
 *      In the app dashboard, find "Instagram" under Add Products,
 *      and set it up for "Instagram Login" (not the older Graph API /
 *      Facebook Login flavor — you don't need a Facebook Page for this one).
 *      This gives you an Instagram App ID and Instagram App Secret —
 *      copy both, you'll need them below.
 *
 * 4. Add yourself as a tester (skips Meta's app-review process, which
 *    you don't need since you're only ever fetching your own account):
 *      In the Instagram product's settings, find "Roles" or "Instagram
 *      Testers", add @mengedohtcnc, then accept the invite from inside
 *      the Instagram app (Settings → Apps and websites → Tester invites).
 *
 * 5. Set the OAuth redirect URI:
 *      In the Instagram product's settings, add this as an allowed
 *      "OAuth Redirect URI" (fill in your actual worker URL from step 7):
 *        https://YOUR-WORKER-SUBDOMAIN.workers.dev/callback
 *
 * ───────────────────────────────────────────────────────────────────────
 * DEPLOY THIS WORKER
 * ───────────────────────────────────────────────────────────────────────
 *
 * 6. Go to https://workers.cloudflare.com and log in.
 * 7. Click "Create Worker", paste this entire file in, and deploy.
 *    Note the worker's URL (looks like https://instagram-feed.YOUR-NAME.workers.dev)
 *    — go back and finish step 5 above with this exact URL + "/callback".
 * 8. Go to Settings → Variables and add these (as plain variables, not secrets,
 *    except IG_APP_SECRET and CONNECT_KEY which should be "Encrypt"):
 *      IG_APP_ID       — from step 3
 *      IG_APP_SECRET   — from step 3 (encrypt this one)
 *      ALLOWED_ORIGIN  — https://mengedohtcnc.com
 *      CONNECT_KEY     — make up any private password (encrypt this one) —
 *                        stops random visitors from re-connecting a
 *                        different Instagram account to your feed
 * 9. Go to Settings → Bindings → KV Namespace Bindings → add binding.
 *    Create a new namespace (call it anything, e.g. "instagram-feed"),
 *    and set the variable name to exactly: IG_KV
 * 10. Go to Settings → Triggers → Cron Triggers → Add Cron Trigger.
 *     Use this schedule so the token refreshes well within its 60-day
 *     window: 0 0 1,15 * *   (runs the 1st and 15th of every month)
 *
 * ───────────────────────────────────────────────────────────────────────
 * CONNECT YOUR ACCOUNT (one time, ~30 seconds)
 * ───────────────────────────────────────────────────────────────────────
 *
 * 11. Visit this URL in your browser (replace with your real values):
 *       https://YOUR-WORKER-URL/connect?key=YOUR_CONNECT_KEY
 *     Log into Instagram if asked, approve access, and you'll land on a
 *     "Connected!" page. That's it — the feed is live and will keep
 *     refreshing itself automatically from now on.
 *
 * 12. Send me the worker's URL and I'll wire it into the site.
 */

const IG_OAUTH_URL   = 'https://www.instagram.com/oauth/authorize';
const IG_TOKEN_URL    = 'https://api.instagram.com/oauth/access_token';
const IG_EXCHANGE_URL = 'https://graph.instagram.com/access_token';
const IG_REFRESH_URL  = 'https://graph.instagram.com/refresh_access_token';
const IG_MEDIA_FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://mengedohtcnc.com';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/connect') {
        return handleConnect(url, env);
      }
      if (url.pathname === '/callback') {
        return await handleCallback(url, env);
      }
      return await handleMedia(request, env, ctx, corsHeaders);
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500, headers: corsHeaders });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshToken(env));
  },
};

// ── /connect — kick off the one-time OAuth flow ──
function handleConnect(url, env) {
  if (!env.CONNECT_KEY || url.searchParams.get('key') !== env.CONNECT_KEY) {
    return new Response('Missing or incorrect ?key=', { status: 403 });
  }
  const redirectUri = `${url.origin}/callback`;
  const authUrl = new URL(IG_OAUTH_URL);
  authUrl.searchParams.set('client_id', env.IG_APP_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'instagram_business_basic');
  return Response.redirect(authUrl.toString(), 302);
}

// ── /callback — Instagram sends the user back here with a ?code= ──
async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code from Instagram.', { status: 400 });

  const redirectUri = `${url.origin}/callback`;
  const form = new FormData();
  form.set('client_id', env.IG_APP_ID);
  form.set('client_secret', env.IG_APP_SECRET);
  form.set('grant_type', 'authorization_code');
  form.set('redirect_uri', redirectUri);
  form.set('code', code);

  const shortRes = await fetch(IG_TOKEN_URL, { method: 'POST', body: form });
  if (!shortRes.ok) return new Response(`Token exchange failed: ${await shortRes.text()}`, { status: 500 });
  const short = await shortRes.json();

  const exchangeUrl = new URL(IG_EXCHANGE_URL);
  exchangeUrl.searchParams.set('grant_type', 'ig_exchange_token');
  exchangeUrl.searchParams.set('client_secret', env.IG_APP_SECRET);
  exchangeUrl.searchParams.set('access_token', short.access_token);
  const longRes = await fetch(exchangeUrl.toString());
  if (!longRes.ok) return new Response(`Long-lived exchange failed: ${await longRes.text()}`, { status: 500 });
  const long = await longRes.json();

  await env.IG_KV.put('token_data', JSON.stringify({
    access_token: long.access_token,
    user_id: short.user_id,
    obtained_at: Date.now(),
  }));

  return new Response(
    '<h1>Connected!</h1><p>Your Instagram feed is now live and will keep itself updated automatically. You can close this tab.</p>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// ── default route — return recent media as JSON, cached for an hour ──
async function handleMedia(request, env, ctx, corsHeaders) {
  const cache = caches.default;
  const cacheKey = new Request(new URL('/media-cache', request.url), request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const stored = await env.IG_KV.get('token_data', 'json');
  if (!stored) {
    return new Response(JSON.stringify({ error: 'Not connected yet. Visit /connect?key=... first.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const mediaUrl = new URL(`https://graph.instagram.com/${stored.user_id}/media`);
  mediaUrl.searchParams.set('fields', IG_MEDIA_FIELDS);
  mediaUrl.searchParams.set('access_token', stored.access_token);
  mediaUrl.searchParams.set('limit', '12');

  const res = await fetch(mediaUrl.toString());
  if (!res.ok) {
    return new Response(JSON.stringify({ error: `Instagram API error: ${await res.text()}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
  const data = await res.json();

  const posts = (data.data || []).map(p => ({
    id: p.id,
    caption: (p.caption || '').slice(0, 200),
    permalink: p.permalink,
    image: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
    isVideo: p.media_type === 'VIDEO',
  }));

  const response = new Response(JSON.stringify({ posts }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeaders,
    },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

// ── scheduled refresh — runs on the Cron Trigger, keeps the token alive ──
async function refreshToken(env) {
  const stored = await env.IG_KV.get('token_data', 'json');
  if (!stored) return;

  const refreshUrl = new URL(IG_REFRESH_URL);
  refreshUrl.searchParams.set('grant_type', 'ig_refresh_token');
  refreshUrl.searchParams.set('access_token', stored.access_token);

  const res = await fetch(refreshUrl.toString());
  if (!res.ok) {
    console.error('Instagram token refresh failed:', await res.text());
    return;
  }
  const refreshed = await res.json();

  await env.IG_KV.put('token_data', JSON.stringify({
    ...stored,
    access_token: refreshed.access_token,
    obtained_at: Date.now(),
  }));
}

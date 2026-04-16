/**
 * Mengedoht CNC — Review Submission Worker
 * =========================================
 * Deploy this to Cloudflare Workers:
 *   1. Go to https://workers.cloudflare.com and log in
 *   2. Click "Create Worker", paste this entire file, and save
 *   3. Go to Settings > Variables and add these Environment Variables:
 *        GITHUB_TOKEN  — A GitHub Personal Access Token with "Contents: Read & Write"
 *                        permission on the hankmengedoht-hue/MengedohtCNC repo.
 *                        Create one at: https://github.com/settings/tokens/new
 *                        (select "Fine-grained token", choose the repo, enable Read/Write on Contents)
 *        GITHUB_REPO   — hankmengedoht-hue/MengedohtCNC
 *        ALLOWED_ORIGIN — https://mengedohtcnc.com
 *   4. Copy the Worker URL (e.g. https://review-worker.YOUR_SUBDOMAIN.workers.dev)
 *   5. Paste it into index.html where it says PASTE_YOUR_WORKER_URL_HERE
 */

export default {
  async fetch(request, env) {
    // Support multiple allowed origins (comma-separated env var, or hardcoded fallback)
    const allowedOrigins = (env.ALLOWED_ORIGIN || 'https://mengedohtcnc.com')
      .split(',').map(o => o.trim()).filter(Boolean);
    allowedOrigins.push('https://mengedohtcnc.pages.dev'); // always allow Pages preview URL
    const requestOrigin = request.headers.get('Origin') || '';
    const allowed = allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.formData();
      const name  = (formData.get('name')  || '').trim();
      const title = (formData.get('title') || '').trim();
      const rating = parseInt(formData.get('rating'));
      const body  = (formData.get('body')  || '').trim();
      const imageFile = formData.get('image');

      if (!name || !body || isNaN(rating) || rating < 1 || rating > 5) {
        return json({ error: 'Missing required fields.' }, 400, corsHeaders);
      }

      const timestamp = Date.now();
      const slug = `review-${timestamp}`;
      const date = new Date().toISOString().split('T')[0];
      const repo = env.GITHUB_REPO || 'hankmengedoht-hue/MengedohtCNC';
      const token = env.GITHUB_TOKEN;

      let imagePath = null;

      // Upload image if one was included and is under 5MB
      if (imageFile && imageFile.size > 0 && imageFile.size < 5 * 1024 * 1024) {
        const raw = imageFile.name || 'image.jpg';
        const ext = raw.split('.').pop().toLowerCase().replace(/[^a-z]/g, '') || 'jpg';
        const imgFilename = `${slug}.${ext}`;
        const imageBytes = await imageFile.arrayBuffer();
        const base64 = arrayBufferToBase64(imageBytes);
        await githubPut(token, repo,
          `images/uploads/reviews/${imgFilename}`,
          base64,
          `Upload review image from ${name}`
        );
        imagePath = `/images/uploads/reviews/${imgFilename}`;
      }

      const reviewData = {
        name,
        ...(title    && { title }),
        rating,
        body,
        date,
        ...(imagePath && { image: imagePath }),
        published: false
      };

      // JSON → base64 for GitHub API
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(reviewData, null, 2))));
      await githubPut(token, repo,
        `_data/reviews/${slug}.json`,
        content,
        `New review from ${name}`
      );

      return json({ success: true }, 200, corsHeaders);

    } catch (err) {
      return json({ error: err.message }, 500, corsHeaders);
    }
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function githubPut(token, repo, path, content, message) {
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'MengedohtCNC-Review-Worker'
    },
    body: JSON.stringify({ message, content })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${err}`);
  }
  return res.json();
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

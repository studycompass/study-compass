/**
 * Study Compass — Decap CMS OAuth Proxy (Cloudflare Worker)
 * =========================================================
 *
 * This script acts as an OAuth proxy between Decap CMS and GitHub.
 * It handles the GitHub OAuth flow so you can log in to /admin
 * with your GitHub account.
 *
 * SETUP:
 * 1. Create a GitHub OAuth App (see SETUP-GUIDE.md)
 * 2. Deploy this script to Cloudflare Workers (free tier: 100k req/day)
 * 3. Set environment variables: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 * 4. Update admin/config.yml base_url to your Worker URL
 *
 * DEPLOY:
 * - Go to https://dash.cloudflare.com → Workers & Pages → Create
 * - Paste this entire script
 * - Add Settings → Variables:
 *     GITHUB_CLIENT_ID = your_client_id
 *     GITHUB_CLIENT_SECRET = your_client_secret
 * - Deploy and copy the Worker URL (e.g., https://study-compass-cms.your-name.workers.dev)
 */

const HTML = (data) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Authenticating...</title></head>
<body>
  <script>
    (function() {
      const data = ${JSON.stringify(data)};
      const origin = window.opener || window.parent;
      if (origin) {
        origin.postMessage('authorization:github:success:{"token": "' + data.access_token + '", "provider": "github"}', '*');
      }
      window.setTimeout(function() { window.close(); }, 100);
    })();
  </script>
  <p>Authentication complete. You can close this window.</p>
</body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Step 1: Redirect to GitHub OAuth authorize page
    if (url.pathname === '/api/auth') {
      const redirect_uri = `${url.origin}/api/callback`;
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: redirect_uri,
        scope: 'repo,user',
        state: crypto.randomUUID(),
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302
      );
    }

    // Step 2: Handle GitHub callback, exchange code for token
    if (url.pathname === '/api/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code parameter', { status: 400 });
      }

      try {
        const tokenResponse = await fetch(
          'https://github.com/login/oauth/access_token',
          {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: env.GITHUB_CLIENT_ID,
              client_secret: env.GITHUB_CLIENT_SECRET,
              code: code,
            }),
          }
        );

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return new Response(`OAuth Error: ${tokenData.error_description}`, {
            status: 400,
          });
        }

        return new Response(HTML({ access_token: tokenData.access_token }), {
          headers: { 'Content-Type': 'text/html' },
        });
      } catch (err) {
        return new Response(`Token exchange failed: ${err.message}`, {
          status: 500,
        });
      }
    }

    return new Response('Study Compass OAuth Proxy. See /api/auth to begin.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};

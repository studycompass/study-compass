/**
 * Study Compass — Decap CMS OAuth: Callback Handler
 * File: functions/api/callback.js
 *
 * Cloudflare Pages Function that handles the OAuth callback from GitHub.
 * GitHub redirects here after the user authorizes the app, with a ?code=
 * parameter. This function exchanges that code for an access token, then
 * passes the token back to the Decap CMS window via postMessage.
 *
 * URL: https://your-site.pages.dev/api/callback?code=xxx
 *
 * Environment variables (set in Cloudflare Pages dashboard):
 *   - GITHUB_CLIENT_ID       (from GitHub OAuth App)
 *   - GITHUB_CLIENT_SECRET   (from GitHub OAuth App)
 *
 * Place this file at: functions/api/callback.js in your repository root.
 */

const successHTML = (accessToken) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authentication complete — Study Compass CMS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #FAF6EF;
      color: #4A4036;
    }
    .card {
      background: #FFFCF7;
      border: 1px solid #E8DFD0;
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 4px 16px rgba(120, 100, 80, 0.08);
    }
    .card h1 { color: #B0876B; font-size: 1.3rem; margin: 0 0 8px; }
    .card p { color: #7A6E5F; font-size: 0.9rem; margin: 0; }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #E8DFD0;
      border-top-color: #B0876B;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 16px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authentication Successful</h1>
    <div class="spinner"></div>
    <p>Returning to the CMS dashboard...</p>
  </div>
  <script>
    (function() {
      var token = ${JSON.stringify(accessToken)};
      var message = 'authorization:github:success:{"token":"' + token + '","provider":"github"}';
      if (window.opener) {
        window.opener.postMessage(message, '*');
      }
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      window.setTimeout(function() { window.close(); }, 2000);
    })();
  </script>
</body>
</html>`;

const errorHTML = (errorMsg) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authentication Error — Study Compass CMS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; background: #FAF6EF; color: #4A4036;
    }
    .card {
      background: #FFFCF7; border: 1px solid #E8DFD0; border-radius: 16px;
      padding: 40px; text-align: center; max-width: 500px;
      box-shadow: 0 4px 16px rgba(120, 100, 80, 0.08);
    }
    .card h1 { color: #b43c3c; font-size: 1.3rem; margin: 0 0 12px; }
    .card p { color: #7A6E5F; font-size: 0.9rem; margin: 0 0 8px; }
    .card code { display: block; background: #f5f0e8; padding: 12px; border-radius: 8px; font-size: 0.82rem; text-align: left; margin-top: 12px; color: #b43c3c; word-break: break-word; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authentication Failed</h1>
    <p>There was an error during GitHub authentication.</p>
    <code>${errorMsg}</code>
    <p style="margin-top: 16px; font-size: 0.82rem;">Check your Cloudflare Pages environment variables and GitHub OAuth App settings.</p>
  </div>
</body>
</html>`;

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  // Step 1: Validate the code parameter exists
  if (!code) {
    return new Response(errorHTML('Missing "code" parameter in callback URL. This usually means GitHub did not redirect properly.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Step 2: Validate environment variables are set
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(errorHTML('Missing environment variables GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET. Set these in your Cloudflare Pages dashboard under Settings → Environment variables.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Step 3: Exchange the code for an access token
  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'study-compass-cms',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(errorHTML(`GitHub token exchange failed (${tokenResponse.status}): ${errorText}`), {
        status: 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const tokenData = await tokenResponse.json();

    // Step 4: Check for OAuth errors
    if (tokenData.error) {
      return new Response(errorHTML(`GitHub OAuth Error: ${tokenData.error_description || tokenData.error}`), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (!tokenData.access_token) {
      return new Response(errorHTML('GitHub did not return an access token. Response: ' + JSON.stringify(tokenData)), {
        status: 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Step 5: Success — return HTML that passes the token to the CMS window
    return new Response(successHTML(tokenData.access_token), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (err) {
    return new Response(errorHTML(`Network error during token exchange: ${err.message}`), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

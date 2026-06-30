/**
 * Study Compass — Decap CMS OAuth: Authorization Redirect
 * File: functions/api/auth.js
 *
 * Cloudflare Pages Function that redirects the user to GitHub's OAuth
 * authorize page. This is the entry point Decap CMS calls when you
 * click "Login with GitHub" in the /admin dashboard.
 *
 * URL: https://your-site.pages.dev/api/auth
 *
 * Environment variables (set in Cloudflare Pages dashboard):
 *   - GITHUB_CLIENT_ID     (from GitHub OAuth App)
 *   - OAUTH_REDIRECT_URL   (full callback URL, e.g. https://your-site.pages.dev/api/callback)
 *
 * Place this file at: functions/api/auth.js in your repository root.
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // The callback URL — must match the GitHub OAuth App's "Authorization callback URL"
  // Default to the same domain + /api/callback
  const redirect_uri = env.OAUTH_REDIRECT_URL || `${url.origin}/api/callback`;

  // Required parameters for GitHub OAuth authorize endpoint
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: redirect_uri,
    scope: 'repo,user',
    state: crypto.randomUUID(),
  });

  // Redirect to GitHub
  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params}`;
  return Response.redirect(githubAuthUrl, 302);
}

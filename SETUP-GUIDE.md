# Study Compass CMS — Setup Guide

This guide walks you through the one-time setup to activate the Decap CMS admin dashboard at `/admin`.

## Overview

Your blog now uses:
- **Jekyll** (built into GitHub Pages) to render Markdown posts into HTML
- **Decap CMS** (at `/admin`) for browser-based article editing
- **GitHub OAuth** for secure authentication

After setup, you can visit `https://studycompass.github.io/study-compass/admin/`, log in with GitHub, write articles in Markdown, and publish with one click.

---

## Step 1: Create a GitHub OAuth App

Decap CMS needs to authenticate with GitHub on your behalf. You need to create an OAuth App:

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   - Direct link: https://github.com/settings/applications/new
2. Fill in:
   - **Application name:** `Study Compass CMS`
   - **Homepage URL:** `https://studycompass.github.io/study-compass/`
   - **Authorization callback URL:** `https://YOUR-WORKER-URL.workers.dev/api/callback`
     (You'll get the Worker URL in Step 2. For now, enter a placeholder and update it later.)
3. Click **Register application**
4. Note your **Client ID** (displayed on the next page)
5. Click **Generate a new client secret**
6. Note your **Client Secret** (you won't see it again — copy it now)

---

## Step 2: Deploy the OAuth Proxy (Cloudflare Worker)

GitHub OAuth requires a server-side component to exchange the authorization code for an access token. Since GitHub Pages is static, we deploy a tiny Cloudflare Worker (free tier: 100,000 requests/day).

### Option A: Cloudflare Workers (Recommended — Free)

1. Go to **https://dash.cloudflare.com** and create a free account
2. Navigate to **Workers & Pages → Create → Create Worker**
3. Give it a name: `study-compass-cms`
4. Delete the default code and paste the entire contents of `admin/oauth-worker.js`
5. Click **Deploy**
6. Note your Worker URL (e.g., `https://study-compass-cms.your-name.workers.dev`)
7. Go to **Settings → Variables** and add:
   - `GITHUB_CLIENT_ID` = your Client ID from Step 1
   - `GITHUB_CLIENT_SECRET` = your Client Secret from Step 1
8. Click **Save and Deploy**

### Option B: Alternative — Use an existing OAuth proxy

If you don't want to set up Cloudflare, you can use a community-hosted proxy:
- **https://decap-oauth.netlify.app** (free, community-maintained)
- Set `base_url: https://decap-oauth.netlify.app` in `admin/config.yml`

Note: Community proxies may have rate limits or downtime. For production use, deploy your own Worker.

---

## Step 3: Update the OAuth App Callback URL

Go back to your GitHub OAuth App settings:
1. **GitHub → Settings → Developer settings → OAuth Apps → Study Compass CMS**
2. Update **Authorization callback URL** to:
   ```
   https://YOUR-WORKER-URL.workers.dev/api/callback
   ```
   (Replace with your actual Cloudflare Worker URL from Step 2)
3. Click **Update application**

---

## Step 4: Update Decap CMS Config

Edit `admin/config.yml` in your repository:

```yaml
backend:
  name: github
  repo: studycompass/study-compass
  branch: main
  base_url: https://YOUR-WORKER-URL.workers.dev  # ← Update this!
  auth_endpoint: api/auth
```

Replace `https://your-oauth-proxy.workers.dev` with your actual Worker URL.

Commit this change to your repository.

---

## Step 5: Test the CMS

1. Wait 1-2 minutes for GitHub Pages to rebuild (Jekyll processes your site)
2. Visit: `https://studycompass.github.io/study-compass/admin/`
3. You should see the Decap CMS login screen
4. Click **Login with GitHub**
5. Authorize the "Study Compass CMS" OAuth app
6. You should now see the CMS dashboard with:
   - **Blog Posts** collection (with the sample "Welcome" post)
   - **Image Library** collection

---

## Step 6: Publish Your First Article

1. In the CMS dashboard, click **New Post** under Blog Posts
2. Fill in:
   - **Title:** Your article title
   - **Publish Date:** When to publish
   - **Draft:** Uncheck to publish immediately
   - **Featured Image:** Click to upload an image
   - **Excerpt:** Short summary for the blog index
   - **Categories:** e.g., "Productivity"
   - **Tags:** e.g., "pomodoro, focus, timer"
   - **Article Content:** Write in Markdown
3. Click **Publish**
4. The CMS commits the Markdown file to your `_posts/` folder on GitHub
5. GitHub Pages rebuilds automatically (1-2 minutes)
6. Your article appears at `https://studycompass.github.io/study-compass/articles/your-article-title/`
7. It also appears on the blog homepage under "Latest Articles"

---

## How It Works (Architecture)

```
You write article in /admin
        ↓
Decap CMS commits .md file to _posts/ on GitHub
        ↓
GitHub Pages detects new commit
        ↓
Jekyll builds site (auto on GitHub Pages)
        ↓
Markdown post → HTML article page at /articles/title/
        ↓
Blog index auto-updates with new post card
        ↓
Sitemap auto-updates with new URL
        ↓
RSS feed auto-updates at /feed.xml
        ↓
Search index auto-updates at /search.json
```

---

## Features

| Feature | How |
|---|---|
| Create articles | /admin → New Post |
| Edit articles | /admin → click any post |
| Delete articles | /admin → click post → Delete |
| Save drafts | Check "Draft" field → Save (doesn't publish) |
| Upload images | In the editor, click image field → upload |
| Categories & tags | List fields in the post editor |
| SEO title | "SEO Title" field (optional, falls back to title) |
| Meta description | "Meta Description" field (optional, falls back to excerpt) |
| Featured image | "Featured Image" field → upload or select |
| Publication date | "Publish Date" datetime field |
| Publish with one click | Click "Publish" button |
| Related articles | Auto-shown at bottom of each post (3 most recent) |
| Reading time | Auto-calculated from word count |
| Search | Client-side search on blog page (powered by search.json) |
| RSS feed | Auto-generated at /feed.xml (jekyll-feed plugin) |
| Sitemap | Auto-updated (jekyll-sitemap) |

---

## Troubleshooting

### CMS doesn't load (stuck on "Loading...")
- Check that `admin/config.yml` has the correct `base_url` (your Worker URL)
- Check that the Cloudflare Worker is deployed and running
- Check browser console for errors (F12 → Console)

### Login fails
- Verify the OAuth App callback URL matches your Worker URL exactly
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in Cloudflare
- Make sure the OAuth App is set to "Public" (or your account is the owner)

### Published article doesn't appear
- Wait 2-3 minutes for GitHub Pages to rebuild
- Check GitHub Actions tab for build errors
- Verify the .md file is in `_posts/` with the correct filename format: `YYYY-MM-DD-title.md`
- Check that `draft: false` in the post's front matter

### Images don't load
- Images are stored in `assets/images/blog/`
- The CMS uploads them automatically when you use the image widget
- Check that the image path in the post starts with `/assets/images/blog/`

---

## Security Notes

- The `/admin` page is protected by GitHub OAuth — only users you authorize can access it
- The OAuth App can be set to "Private" (only your GitHub account) or "Public" (anyone with a GitHub account)
- For a personal blog, set the OAuth App to private
- The Cloudflare Worker only handles the OAuth token exchange — it doesn't store any data
- Your GitHub token is stored in the browser's local storage and sent directly to the GitHub API

---

## Maintenance

- **Adding authors:** Add an `author` field to the CMS config and a corresponding field in `_layouts/article.html`
- **Custom categories:** The CMS uses a free-text list for categories. To enforce a dropdown, change the widget type in `admin/config.yml`
- **Changing permalink structure:** Edit `permalink` in `_config.yml`
- **Adding pagination:** Already configured (6 posts per page). Jekyll auto-generates `/articles/page/2/`, etc.

That's it! Your blog is now a professional publishing platform. 🎉

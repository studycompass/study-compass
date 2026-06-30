/* blog-loader.js
   Fetches posts.json and renders the Study Compass blog dynamically.
   Drop this script into blog.html (see integration notes from Claude),
   and add three empty containers where content should appear:

     <div id="sc-featured"></div>
     <div id="sc-article-list"></div>
     <div id="sc-full-articles"></div>

   New posts published via admin.html appear here automatically —
   no HTML editing required ever again.
*/
(function () {
  const STYLE = `
    .sc-card{display:block;border:1px solid #E4DCCC;border-radius:14px;padding:18px;margin-bottom:14px;text-decoration:none;color:inherit;background:#FFFDFA;transition:box-shadow .15s ease;}
    .sc-card:hover{box-shadow:0 4px 14px rgba(0,0,0,0.06);}
    .sc-card .sc-eyebrow{font-size:.78rem;font-weight:600;color:#C1654B;text-transform:uppercase;letter-spacing:.04em;}
    .sc-card h3{margin:6px 0;font-size:1.05rem;}
    .sc-card p{margin:0;color:#5c5648;font-size:.92rem;}
    .sc-featured-card{display:block;border-radius:16px;padding:24px;margin-bottom:28px;background:linear-gradient(135deg,#FAF6EF,#F1E8D8);border:1px solid #E4DCCC;text-decoration:none;color:inherit;}
    .sc-featured-card .sc-eyebrow{font-size:.78rem;font-weight:700;color:#C1654B;text-transform:uppercase;}
    .sc-featured-card h2{margin:8px 0;font-size:1.4rem;}
    .sc-meta{font-size:.82rem;color:#8a8270;margin:4px 0 10px;}
    .sc-article{padding:32px 0;border-top:1px solid #E4DCCC;}
    .sc-article h2{font-size:1.6rem;margin-bottom:4px;}
    .sc-article .sc-meta{margin-bottom:18px;}
    .sc-article p,.sc-article li{line-height:1.7;color:#3a362e;}
    .sc-article h2.sc-subhead{font-size:1.2rem;margin-top:28px;}
    .sc-article blockquote{border-left:3px solid #C1654B;margin:20px 0;padding:8px 16px;font-style:italic;color:#5c5648;}
    .sc-back{display:inline-block;margin-top:18px;font-size:.88rem;color:#5C6E55;text-decoration:none;}
  `;
  function injectStyle() {
    if (document.getElementById('sc-loader-style')) return;
    const s = document.createElement('style');
    s.id = 'sc-loader-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function formatDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  function renderFeatured(post) {
    const el = document.getElementById('sc-featured');
    if (!el || !post) return;
    el.innerHTML = `
      <a class="sc-featured-card" href="#${post.slug}">
        <span class="sc-eyebrow">${post.emoji} Featured · ${post.category}</span>
        <h2>${post.title}</h2>
        <p class="sc-meta">📅 ${formatDate(post.date)} · ☕ ${post.readTime} · 🧭 ${post.author}</p>
        <p>${post.excerpt}</p>
      </a>`;
  }

  function renderList(posts) {
    const el = document.getElementById('sc-article-list');
    if (!el) return;
    el.innerHTML = posts.map(p => `
      <a class="sc-card" href="#${p.slug}">
        <span class="sc-eyebrow">${p.emoji} ${p.category}</span>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
      </a>`).join('');
  }

  function renderFull(posts) {
    const el = document.getElementById('sc-full-articles');
    if (!el) return;
    el.innerHTML = posts.map(p => `
      <article class="sc-article" id="${p.slug}">
        <span class="sc-eyebrow">${p.category}</span>
        <h2>${p.emoji} ${p.title}</h2>
        <p class="sc-meta">📅 ${formatDate(p.date)} · ☕ ${p.readTime} · 🧭 ${p.author}</p>
        ${p.bodyHtml}
        <a class="sc-back" href="#sc-article-list">↑ Back to all articles</a>
      </article>`).join('');
  }

  fetch('posts.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(posts => {
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      injectStyle();
      const featured = posts.find(p => p.featured) || posts[0];
      renderFeatured(featured);
      renderList(posts);
      renderFull(posts);
    })
    .catch(err => {
      console.error('Could not load blog posts:', err);
      const el = document.getElementById('sc-article-list');
      if (el) el.textContent = 'Could not load posts right now — please refresh.';
    });
})();

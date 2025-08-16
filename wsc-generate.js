// wsc-generate.js — NEXT LEVEL version (known-good)
// Builds static site from your YouTube channel RSS (no API key).
// Adds search, auto-tags, tag pages, Shorts/Long hubs, JSON-LD, share buttons, better SEO.

import fs from "fs/promises";
import path from "path";

const BRAND = {
  siteTitle: "West Side Cotorreo — Podcast Oficial",
  baseUrl: "https://baysbestshorts-eng.github.io/westsidecotorreo-site", // no trailing slash
  channelId: "UCmJ1mRAtqRB0QUPYP-uvZiw",
  maxVideos: 300
};

const OUT = "site";

/* ----------------- Styles ----------------- */
const css = `
:root{
  --bg:#FFFFFF;
  --bg-accent:#F8F9FA;
  --text:#1A1A1A;
  --muted:#6B7280;
  --card:#FFFFFF;
  --line:#E5E7EB;
  --brand:#006847;
  --brand-dark:#004A35;
  --accent:#CE1126;
  --accent-light:#EF4444;
  --shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg:0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

*{box-sizing:border-box}

body{
  font-family:'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  margin:0;
  background:linear-gradient(135deg, var(--bg) 0%, var(--bg-accent) 100%);
  color:var(--text);
  line-height:1.6;
  font-size:16px;
}

.wrap{
  max-width:1200px;
  margin:0 auto;
  padding:24px;
}

/* Sticky Navigation */
header{
  position:sticky;
  top:0;
  z-index:100;
  background:rgba(255, 255, 255, 0.95);
  backdrop-filter:blur(10px);
  border-bottom:1px solid var(--line);
  margin:-24px -24px 32px -24px;
  padding:16px 24px;
  display:flex;
  gap:16px;
  justify-content:space-between;
  align-items:center;
  transition:all 0.3s ease;
}

header:hover{
  background:rgba(255, 255, 255, 0.98);
  box-shadow:var(--shadow);
}

header .logo{
  font-size:24px;
  font-weight:800;
  color:var(--brand);
  text-decoration:none;
  transition:color 0.2s ease;
}

header .logo:hover{
  color:var(--brand-dark);
  text-decoration:none;
}

h1{
  font-size:clamp(32px, 5vw, 48px);
  font-weight:800;
  margin:0 0 16px 0;
  color:var(--brand);
  text-align:center;
  letter-spacing:-0.02em;
}

a{
  color:var(--brand);
  text-decoration:none;
  transition:all 0.2s ease;
}

a:hover{
  color:var(--brand-dark);
  text-decoration:underline;
}

/* Enhanced Grid */
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(320px,1fr));
  gap:24px;
  margin-top:32px;
}

/* Modern Card Design */
.card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:16px;
  padding:20px;
  transition:all 0.3s ease;
  box-shadow:var(--shadow);
  overflow:hidden;
}

.card:hover{
  transform:translateY(-4px);
  box-shadow:var(--shadow-lg);
  border-color:var(--brand);
}

.card a{
  text-decoration:none;
  color:inherit;
  display:block;
}

.card a:hover{
  text-decoration:none;
}

.card img{
  width:100%;
  border-radius:12px;
  margin-bottom:16px;
  transition:transform 0.3s ease;
}

.card:hover img{
  transform:scale(1.02);
}

.card h3{
  font-size:18px;
  font-weight:600;
  margin:0 0 12px 0;
  color:var(--text);
  line-height:1.4;
}

/* Modern Buttons */
.btn{
  display:inline-flex;
  align-items:center;
  padding:12px 24px;
  border-radius:12px;
  background:var(--brand);
  color:#fff;
  font-weight:600;
  font-size:14px;
  margin:8px 12px 8px 0;
  transition:all 0.2s ease;
  border:none;
  cursor:pointer;
  text-decoration:none;
}

.btn:hover{
  background:var(--brand-dark);
  transform:translateY(-1px);
  box-shadow:var(--shadow);
  color:#fff;
  text-decoration:none;
}

.btn.secondary{
  background:transparent;
  color:var(--brand);
  border:2px solid var(--brand);
}

.btn.secondary:hover{
  background:var(--brand);
  color:#fff;
}

.btn.accent{
  background:var(--accent);
}

.btn.accent:hover{
  background:#B91C1C;
}

/* Enhanced Tags */
.tag{
  background:var(--bg-accent);
  color:var(--brand);
  border:1px solid var(--line);
  border-radius:20px;
  padding:6px 14px;
  font-size:12px;
  font-weight:500;
  margin:4px 8px 4px 0;
  display:inline-block;
  transition:all 0.2s ease;
}

.tag:hover{
  background:var(--brand);
  color:#fff;
  border-color:var(--brand);
}

/* Enhanced Navigation */
.nav{
  display:flex;
  gap:16px;
  flex-wrap:wrap;
  align-items:center;
}

.nav a{
  padding:8px 16px;
  border-radius:8px;
  font-weight:500;
  transition:all 0.2s ease;
}

.nav a:hover{
  background:var(--brand);
  color:#fff;
  text-decoration:none;
}

/* Search Enhancement */
.search{
  display:flex;
  gap:16px;
  align-items:center;
  margin:24px 0;
  padding:24px;
  background:var(--card);
  border-radius:16px;
  box-shadow:var(--shadow);
}

input[type="search"]{
  flex:1;
  padding:14px 18px;
  border-radius:12px;
  border:2px solid var(--line);
  font-size:16px;
  transition:all 0.2s ease;
  background:var(--bg);
}

input[type="search"]:focus{
  outline:none;
  border-color:var(--brand);
  box-shadow:0 0 0 3px rgba(0, 104, 71, 0.1);
}

input[type="search"]::placeholder{
  color:var(--muted);
}

/* Enhanced Footer */
footer{
  margin:80px 0 40px;
  padding:40px 0;
  background:var(--brand);
  color:#fff;
  text-align:center;
  border-radius:16px;
  margin-left:-24px;
  margin-right:-24px;
  padding-left:24px;
  padding-right:24px;
}

.footer-content{
  max-width:800px;
  margin:0 auto;
}

.footer-title{
  font-size:24px;
  font-weight:700;
  margin-bottom:16px;
  color:#fff;
}

.footer-description{
  font-size:16px;
  opacity:0.9;
  margin-bottom:32px;
  line-height:1.6;
}

.social-links{
  display:flex;
  gap:16px;
  justify-content:center;
  margin-bottom:24px;
  flex-wrap:wrap;
}

.social-link{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:12px 20px;
  background:rgba(255, 255, 255, 0.1);
  border-radius:12px;
  color:#fff;
  text-decoration:none;
  font-weight:500;
  transition:all 0.2s ease;
  backdrop-filter:blur(10px);
}

.social-link:hover{
  background:rgba(255, 255, 255, 0.2);
  transform:translateY(-2px);
  color:#fff;
  text-decoration:none;
}

.footer-copyright{
  font-size:14px;
  opacity:0.8;
  border-top:1px solid rgba(255, 255, 255, 0.2);
  padding-top:24px;
}

/* Utility Classes */
.small{
  font-size:14px;
  color:var(--muted);
  font-weight:500;
}

hr{
  border:0;
  border-top:1px solid var(--line);
  margin:32px 0;
}

/* Responsive Design */
@media (max-width: 768px){
  .wrap{
    padding:16px;
  }
  
  header{
    margin:-16px -16px 24px -16px;
    padding:12px 16px;
    flex-direction:column;
    gap:12px;
    text-align:center;
  }
  
  .nav{
    justify-content:center;
  }
  
  .grid{
    grid-template-columns:1fr;
    gap:20px;
  }
  
  .search{
    flex-direction:column;
    gap:12px;
    text-align:center;
  }
  
  .social-links{
    flex-direction:column;
    align-items:center;
  }
  
  footer{
    margin-left:-16px;
    margin-right:-16px;
    padding-left:16px;
    padding-right:16px;
  }
}

/* Loading Animation */
@keyframes fadeInUp{
  from{
    opacity:0;
    transform:translateY(20px);
  }
  to{
    opacity:1;
    transform:translateY(0);
  }
}

.card{
  animation:fadeInUp 0.6s ease-out;
}

.card:nth-child(2){animation-delay:0.1s;}
.card:nth-child(3){animation-delay:0.2s;}
.card:nth-child(4){animation-delay:0.3s;}
.card:nth-child(5){animation-delay:0.4s;}
.card:nth-child(6){animation-delay:0.5s;}
`;

/* ----------------- Head ----------------- */
const head = (title, desc, url, image) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="podcast, West Side Cotorreo, episodios, shorts, entretenimiento, México">
<meta name="author" content="West Side Cotorreo">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#006847">
<link rel="canonical" href="${url}">

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎙️</text></svg>">
<link rel="alternate icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23006847'/><text y='.9em' x='.1em' font-size='80' fill='white'>W</text></svg>">

<!-- Web Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- SEO Meta Tags -->
<meta name="google-site-verification" content="nuTAFFgWa9EpE_0-svLICBXdOiuwkP4OZlJyulyc9MI" />

<!-- Open Graph -->
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:site_name" content="West Side Cotorreo">
<meta property="og:locale" content="es_MX">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">

<!-- Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "PodcastSeries",
  "name": "West Side Cotorreo",
  "description": "${desc}",
  "url": "${url}",
  "image": "${image}",
  "inLanguage": "es-MX",
  "genre": "Comedy",
  "publisher": {
    "@type": "Organization",
    "name": "West Side Cotorreo"
  }
}
</script>

<style>${css}</style>
</head>`;

/* ----------------- Helpers ----------------- */
const clean = s => (s || "").toString().replace(/\s+/g," ").trim();
const slug = s => clean(s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"").slice(0,80);

const shareLinks = (url, title) => ({
  x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  li: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  rd: `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  wa: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`
});

/* ----------------- Auto-tagging ----------------- */
const KEYWORDS = [
  { tag: "shorts",     any: [/\b#?shorts?\b/i] },
  { tag: "fútbol",     any: [/futbol|fútbol|soccer|liga mx|chivas|américa/i] },
  { tag: "boxeo",      any: [/boxeo|boxing|Canelo|Tyson|UFC|MMA/i] },
  { tag: "UFC",        any: [/\bUFC\b|ultimate fighting/i] },
  { tag: "NBA",        any: [/\bNBA\b|Lakers|Celtics|Warriors|LeBron|Kobe/i] },
  { tag: "MLB",        any: [/\bMLB\b|Dodgers|Yankees|Padres|Angels/i] },
  { tag: "NFL",        any: [/\bNFL\b|Raiders|Cowboys|Patriots|Chiefs/i] },
  { tag: "noticias",   any: [/noticia|news|política|gobierno|protesta/i] },
  { tag: "OC",         any: [/orange county|santa ana|anaheim|costa mesa|oc\b/i] },
  { tag: "cultura",    any: [/cultura|mexicano|chicano|tradición|familia/i] },
  { tag: "entrevista", any: [/entrevista|invitado|guest|plática/i] },
  { tag: "música",     any: [/música|corridos|banda|rap|hip hop|reggaeton/i] },
  { tag: "podcast",    any: [/.+/] }
];

function detectTags(title, desc) {
  const hay = (re) => re.test(title) || re.test(desc);
  const set = new Set();
  for (const row of KEYWORDS) if (row.any.some(hay)) set.add(row.tag);
  return Array.from(set);
}

/* ----------------- RSS fetch (retry + fallback) ----------------- */
async function fetchRSS(channelId) {
  const urls = [
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    `https://r.jina.ai/http://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  ];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  async function tryFetch(u) {
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (e) { lastErr = e; await sleep(1200 * (i + 1)); }
    }
    throw lastErr;
  }
  let xml = "";
  for (const u of urls) {
    try { xml = await tryFetch(u); break; } catch { /* try next */ }
  }
  if (!xml) { console.warn("RSS fetch failed; building empty site."); return []; }

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m => m[1]);
  return entries.map(e => {
    const get = re => (e.match(re)||[])[1] || "";
    const id = get(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const title = (get(/<title>([\s\S]*?)<\/title>/) || "").trim();
    const desc = (get(/<media:description>([\s\S]*?)<\/media:description>/) || "").trim();
    const pub = get(/<published>(.*?)<\/published>/);
    const thumb = get(/<media:thumbnail url="(.*?)"/) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const tags = detectTags(title + " " + desc, desc);
    return { id, title, summary: desc.slice(0,600), published: pub, thumb, slug: slug(title || id), tags };
  });
}

/* ----------------- Pages ----------------- */
const homePage = (videos, tags) => {
  const url = BRAND.baseUrl;
  const desc = "Episodios y Shorts de West Side Cotorreo con búsqueda, tags y hubs.";
  const og = videos[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(BRAND.siteTitle, desc, url, og)}<body><div class="wrap">
<header role="banner">
  <div><a href="${BRAND.baseUrl}" class="logo" aria-label="West Side Cotorreo - Inicio">${BRAND.siteTitle}</a></div>
  <nav class="nav" role="navigation" aria-label="Navegación principal">
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <a href="${BRAND.baseUrl}/rss.xml" aria-label="RSS Feed">RSS</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a>
  </nav>
</header>

<main role="main">
  <h1>Podcast Oficial de West Side Cotorreo</h1>
  
  <div class="search" role="search">
    <input id="q" type="search" placeholder="Buscar episodio, invitado o tema…" aria-label="Buscar episodios">
    <div class="small">Filtrar:
      ${tags.map(t=>`<a class="tag" href="${BRAND.baseUrl}/tags/${slug(t)}/" aria-label="Filtrar por ${t}">${t}</a>`).join(" ")}
    </div>
  </div>

  <div class="grid" id="grid">
  ${videos.map(v=>`
    <article class="card" data-title="${v.title.toLowerCase()}" data-tags="${v.tags.join(",").toLowerCase()}">
      <a href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Ver episodio: ${v.title}">
        <img src="${v.thumb}" alt="Miniatura del episodio: ${v.title}">
        <h3>${v.title}</h3>
        <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      </a>
    </article>`).join("")}
  </div>

<script>
const q=document.getElementById('q'), cards=[...document.querySelectorAll('#grid .card')];
q?.addEventListener('input', e=>{
  const s=e.target.value.toLowerCase();
  cards.forEach(c=>{
    const ok=c.dataset.title.includes(s)||c.dataset.tags.includes(s);
    c.style.display=ok?'':'none';
  });
});
</script>
</main>

<footer role="contentinfo">
  <div class="footer-content">
    <h2 class="footer-title">West Side Cotorreo</h2>
    <p class="footer-description">El podcast oficial donde el cotorreo nunca para. Síguenos en nuestras redes sociales para no perderte ningún episodio.</p>
    
    <div class="social-links">
      <a href="https://www.youtube.com/@WestSideCotorreo" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="YouTube de West Side Cotorreo">
        <span>📺</span> YouTube
      </a>
      <a href="https://open.spotify.com/show/yourid" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Spotify de West Side Cotorreo">
        <span>🎵</span> Spotify
      </a>
      <a href="https://podcasts.apple.com/podcast/yourid" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Apple Podcasts de West Side Cotorreo">
        <span>🎧</span> Apple Podcasts
      </a>
      <a href="https://twitter.com/westsidecotorreo" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Twitter de West Side Cotorreo">
        <span>🐦</span> Twitter
      </a>
      <a href="https://www.instagram.com/westsidecotorreo" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram de West Side Cotorreo">
        <span>📸</span> Instagram
      </a>
    </div>
    
    <div class="footer-copyright">
      © ${new Date().getFullYear()} West Side Cotorreo. Todos los derechos reservados.
    </div>
  </div>
</footer>
</div></body></html>`;
};

const tagPage = (tag, items) => {
  const url = `${BRAND.baseUrl}/tags/${slug(tag)}/`;
  const desc = `Episodios etiquetados con ${tag} en West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${tag}`, desc, url, og)}<body><div class="wrap">
<header role="banner">
  <div><a href="${BRAND.baseUrl}" class="logo" aria-label="West Side Cotorreo - Inicio">← Inicio</a></div>
  <nav class="nav" role="navigation" aria-label="Navegación principal">
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <a href="${BRAND.baseUrl}/rss.xml" aria-label="RSS Feed">RSS</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a>
  </nav>
</header>

<main role="main">
  <h1>Tag: ${tag}</h1>
  <div class="grid">
  ${items.map(v=>`
    <article class="card">
      <a href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Ver episodio: ${v.title}">
        <img src="${v.thumb}" alt="Miniatura del episodio: ${v.title}">
        <h3>${v.title}</h3>
        <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      </a>
    </article>`).join("")}
  </div>
  
  <div style="text-align:center;margin:40px 0;">
    <a href="${BRAND.baseUrl}" class="btn">Ver todos los episodios</a>
  </div>
</main>

<footer role="contentinfo">
  <div class="footer-content">
    <h2 class="footer-title">West Side Cotorreo</h2>
    <p class="footer-description">El podcast oficial donde el cotorreo nunca para.</p>
    
    <div class="social-links">
      <a href="${BRAND.baseUrl}" class="social-link">🏠 Inicio</a>
      <a href="${BRAND.baseUrl}/rss.xml" class="social-link">📡 RSS</a>
    </div>
    
    <div class="footer-copyright">
      © ${new Date().getFullYear()} West Side Cotorreo. Todos los derechos reservados.
    </div>
  </div>
</footer>
</div></body></html>`;
};

const hubPage = (title, items, slugName) => {
  const url = `${BRAND.baseUrl}/hubs/${slugName}/`;
  const desc = `${title} de West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${title}`, desc, url, og)}<body><div class="wrap">
<header role="banner">
  <div><a href="${BRAND.baseUrl}" class="logo" aria-label="West Side Cotorreo - Inicio">← Inicio</a></div>
  <nav class="nav" role="navigation" aria-label="Navegación principal">
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <a href="${BRAND.baseUrl}/rss.xml" aria-label="RSS Feed">RSS</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a>
  </nav>
</header>

<main role="main">
  <h1>${title}</h1>
  <div class="grid">
  ${items.map(v=>`
    <article class="card">
      <a href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Ver episodio: ${v.title}">
        <img src="${v.thumb}" alt="Miniatura del episodio: ${v.title}">
        <h3>${v.title}</h3>
        <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      </a>
    </article>`).join("")}
  </div>
</main>

<footer role="contentinfo">
  <div class="footer-content">
    <h2 class="footer-title">West Side Cotorreo</h2>
    <p class="footer-description">El podcast oficial donde el cotorreo nunca para.</p>
    
    <div class="social-links">
      <a href="${BRAND.baseUrl}" class="social-link">🏠 Inicio</a>
      <a href="${BRAND.baseUrl}/rss.xml" class="social-link">📡 RSS</a>
    </div>
    
    <div class="footer-copyright">
      © ${new Date().getFullYear()} West Side Cotorreo. Todos los derechos reservados.
    </div>
  </div>
</footer>
</div></body></html>`;
};

const jsonLD = (v) => ({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": v.title,
  "description": v.summary,
  "thumbnailUrl": [v.thumb],
  "uploadDate": new Date(v.published).toISOString(),
  "embedUrl": `https://www.youtube.com/embed/${v.id}`,
  "url": `${BRAND.baseUrl}/episodios/${v.slug}/`
});

const episodePage = (v)=>{
  const base = `${BRAND.baseUrl}/episodios/${v.slug}/`;
  const sh = shareLinks(base, v.title);
  return `${head(v.title, v.summary, base, v.thumb)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>${v.title}</h1>
<div class="tag">${new Date(v.published).toLocaleDateString('es-MX')} ${v.tags.map(t=>`· ${t}`).join(" ")}</div>

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:10px 0 14px">
  <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe>
</div>

<p>${v.summary}</p>

<p>
  <a class="btn" href="https://www.youtube.com/watch?v=${v.id}">Ver en YouTube</a>
  <a class="btn" href="${sh.x}">Compartir en X</a>
  <a class="btn" href="${sh.wa}">WhatsApp</a>
  <a class="btn secondary" href="${sh.rd}">Reddit</a>
  <a class="btn secondary" href="${sh.li}">LinkedIn</a>
  <a class="btn secondary" href="${sh.fb}">Facebook</a>
</p>

<script type="application/ld+json">
${JSON.stringify(jsonLD(v), null, 2)}
</script>

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

/* ----------------- Feeds ----------------- */
const makeRSS = (videos)=>`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${BRAND.siteTitle}</title>
<link>${BRAND.baseUrl}</link>
<description>Landing y enlaces de episodios de West Side Cotorreo</description>
${videos.map(v=>`
<item>
  <title><![CDATA[${v.title}]]></title>
  <link>${BRAND.baseUrl}/episodios/${v.slug}/</link>
  <guid>${BRAND.baseUrl}/episodios/${v.slug}/</guid>
  <pubDate>${new Date(v.published).toUTCString()}</pubDate>
  <description><![CDATA[${v.summary}]]></description>
</item>`).join("")}
</channel></rss>`;

const makeSitemap = (videos,tags)=>`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BRAND.baseUrl}</loc></url>
  <url><loc>${BRAND.baseUrl}/hubs/shorts/</loc></url>
  <url><loc>${BRAND.baseUrl}/hubs/long/</loc></url>
  ${tags.map(t=>`<url><loc>${BRAND.baseUrl}/tags/${slug(t)}/</loc></url>`).join("")}
  ${videos.map(v=>`<url><loc>${BRAND.baseUrl}/episodios/${v.slug}/</loc></url>`).join("")}
</urlset>`;

/* ----------------- Build ----------------- */
async function main(){
  const outDir = path.resolve(OUT);
  await fs.rm(outDir, {recursive:true, force:true});
  await fs.mkdir(outDir, {recursive:true});

  const all = await fetchRSS(BRAND.channelId);
  const videos = all.slice(0, BRAND.maxVideos)
    .sort((a,b)=> new Date(b.published) - new Date(a.published));
  const tags = [...new Set(videos.flatMap(v=>v.tags))];

  await fs.writeFile(path.join(outDir, "index.html"), homePage(videos,tags));
  await fs.writeFile(path.join(outDir, "rss.xml"), makeRSS(videos));
  await fs.writeFile(path.join(outDir, "sitemap.xml"), makeSitemap(videos,tags));

  // Hub pages
  const shorts = videos.filter(v=>v.tags.includes("shorts"));
  const long = videos.filter(v=>!v.tags.includes("shorts"));
  await fs.mkdir(path.join(outDir, "hubs","shorts"), {recursive:true});
  await fs.writeFile(path.join(outDir, "hubs","shorts","index.html"), hubPage("Solo Shorts", shorts, "shorts"));
  await fs.mkdir(path.join(outDir, "hubs","long"), {recursive:true});
  await fs.writeFile(path.join(outDir, "hubs","long","index.html"), hubPage("Episodios largos", long, "long"));

  // Tag pages
  for(const t of tags){
    const items = videos.filter(v=>v.tags.includes(t));
    const dir = path.join(outDir, "tags", slug(t));
    await fs.mkdir(dir, {recursive:true});
    await fs.writeFile(path.join(dir,"index.html"), tagPage(t, items));
  }

  // Episode pages
  for(const v of videos){
    const dir = path.join(outDir, "episodios", v.slug);
    await fs.mkdir(dir, {recursive:true});
    await fs.writeFile(path.join(dir,"index.html"), episodePage(v));
  }

  console.log(`Built ${videos.length} episodes → ${outDir}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });

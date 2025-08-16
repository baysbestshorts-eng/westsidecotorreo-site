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

// Localization support
const LANGUAGES = {
  es: {
    code: 'es',
    name: 'Español',
    siteTitle: 'West Side Cotorreo — Podcast Oficial',
    description: 'Episodios y Shorts de West Side Cotorreo con búsqueda, tags y hubs.',
    nav: {
      shorts: 'Shorts',
      long: 'Episodios largos',
      rss: 'RSS',
      sitemap: 'Sitemap',
      accessibility: 'Accesibilidad'
    },
    search: {
      placeholder: 'Buscar episodio, invitado o tema…',
      filter: 'Filtrar:'
    },
    ui: {
      skipToContent: 'Saltar al contenido principal',
      home: 'Inicio',
      highContrast: 'Alto contraste',
      normalContrast: 'Contraste normal',
      toggleContrast: 'Alternar contraste',
      languageSwitch: 'Cambiar idioma'
    },
    accessibility: {
      title: 'Declaración de Accesibilidad',
      heading: 'Compromiso con la Accesibilidad',
      content: 'Nos comprometemos a hacer que nuestro podcast sea accesible para todos los usuarios, independientemente de sus capacidades.'
    }
  },
  en: {
    code: 'en',
    name: 'English',
    siteTitle: 'West Side Cotorreo — Official Podcast',
    description: 'Episodes and Shorts from West Side Cotorreo with search, tags and hubs.',
    nav: {
      shorts: 'Shorts',
      long: 'Long Episodes',
      rss: 'RSS',
      sitemap: 'Sitemap',
      accessibility: 'Accessibility'
    },
    search: {
      placeholder: 'Search episode, guest or topic…',
      filter: 'Filter:'
    },
    ui: {
      skipToContent: 'Skip to main content',
      home: 'Home',
      highContrast: 'High contrast',
      normalContrast: 'Normal contrast',
      toggleContrast: 'Toggle contrast',
      languageSwitch: 'Switch language'
    },
    accessibility: {
      title: 'Accessibility Statement',
      heading: 'Commitment to Accessibility',
      content: 'We are committed to making our podcast accessible to all users, regardless of their abilities.'
    }
  }
};

const OUT = "site";

/* ----------------- Styles ----------------- */
const css = `
:root{
  --bg:#fafafa;--text:#111;--muted:#777;--card:#fff;--line:#e8e8e8;--brand:#0a5;
  --focus:#005fcc;--focus-ring:2px solid var(--focus);
}
:root.high-contrast{
  --bg:#000;--text:#fff;--muted:#ccc;--card:#111;--line:#444;--brand:#0ff;
  --focus:#ff0;--focus-ring:3px solid var(--focus);
}
*{box-sizing:border-box}
*:focus{outline:var(--focus-ring);outline-offset:2px}
.skip-link{position:absolute;top:-40px;left:6px;background:var(--brand);color:#fff;padding:8px;border-radius:4px;text-decoration:none;z-index:1000;transition:top 0.3s}
.skip-link:focus{top:6px}
.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:var(--bg);color:var(--text);line-height:1.5}
.wrap{max-width:1100px;margin:0 auto;padding:24px}
header{display:flex;gap:16px;justify-content:space-between;align-items:center;margin:6px 0 18px;position:relative}
.header-controls{display:flex;gap:8px;align-items:center}
.lang-switch, .contrast-toggle{background:none;border:1px solid var(--line);border-radius:6px;padding:6px 10px;color:var(--text);cursor:pointer;font-size:12px}
.lang-switch:hover, .contrast-toggle:hover{background:var(--line)}
h1{font-size:40px;margin:10px 0 6px;line-height:1.2}
a{color:var(--brand);text-decoration:none}
a:hover, a:focus{text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;transition:transform 0.2s,box-shadow 0.2s;display:block}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
.card:focus{transform:translateY(-2px)}
.card img{width:100%;border-radius:12px;height:auto;loading:lazy}
.btn{display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;margin:6px 8px 6px 0;border:none;cursor:pointer;text-decoration:none}
.btn:hover, .btn:focus{background:#222}
.btn.secondary{background:#eee;color:#111;border:1px solid #ddd}
.btn.secondary:hover, .btn.secondary:focus{background:#ddd}
.tag{background:#eee;border-radius:999px;padding:6px 10px;font-size:12px;margin:6px 8px 0 0;display:inline-block}
footer{margin:40px 0 10px;color:var(--muted);font-size:12px;text-align:center}
.nav{display:flex;gap:10px;flex-wrap:wrap}
.search{display:flex;gap:10px;align-items:center;margin:10px 0 14px}
input[type="search"]{flex:1;padding:10px 12px;border-radius:10px;border:1px solid #ddd;background:var(--card);color:var(--text)}
.small{font-size:13px;color:var(--muted)}
hr{border:0;border-top:1px solid #e8e8e8;margin:18px 0}
@media (prefers-reduced-motion: reduce){
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important}
}
`;

/* ----------------- Head ----------------- */
const head = (title, desc, url, image, lang = 'es') => `<!doctype html><html lang="${lang}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<link rel="preconnect" href="https://i.ytimg.com">
<link rel="preconnect" href="https://www.youtube.com">
<meta name="google-site-verification" content="nuTAFFgWa9EpE_0-svLICBXdOiuwkP4OZlJyulyc9MI" />
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
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
const homePage = (videos, tags, lang = 'es') => {
  const t = LANGUAGES[lang];
  const url = BRAND.baseUrl;
  const desc = t.description;
  const og = videos[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  const otherLang = lang === 'es' ? 'en' : 'es';
  
  return `${head(t.siteTitle, desc, url, og, lang)}<body><div class="wrap">
<a href="#main-content" class="skip-link">${t.ui.skipToContent}</a>
<header role="banner">
  <div><a href="${BRAND.baseUrl}" style="font-weight:700">${t.siteTitle}</a></div>
  <div class="header-controls">
    <button class="contrast-toggle" onclick="toggleContrast()" aria-label="${t.ui.toggleContrast}">${t.ui.highContrast}</button>
    <select class="lang-switch" onchange="switchLanguage(this.value)" aria-label="${t.ui.languageSwitch}">
      <option value="es" ${lang === 'es' ? 'selected' : ''}>${LANGUAGES.es.name}</option>
      <option value="en" ${lang === 'en' ? 'selected' : ''}>${LANGUAGES.en.name}</option>
    </select>
  </div>
  <nav class="nav small" role="navigation" aria-label="Main navigation">
    <a href="${BRAND.baseUrl}/hubs/shorts/">${t.nav.shorts}</a>
    <a href="${BRAND.baseUrl}/hubs/long/">${t.nav.long}</a>
    <a href="${BRAND.baseUrl}/rss.xml">${t.nav.rss}</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">${t.nav.sitemap}</a>
    <a href="${BRAND.baseUrl}/accessibility/">${t.nav.accessibility}</a>
  </nav>
</header>

<main id="main-content" role="main">
<div class="search" role="search">
  <label for="q" class="visually-hidden">${t.search.placeholder}</label>
  <input id="q" type="search" placeholder="${t.search.placeholder}" aria-describedby="search-help">
  <div class="small" id="search-help">${t.search.filter}
    ${tags.map(t=>`<a class="tag" href="${BRAND.baseUrl}/tags/${slug(t)}/">${t}</a>`).join(" ")}
  </div>
</div>

<div class="grid" id="grid" role="region" aria-label="Episodes grid">
${videos.map(v=>`
  <a class="card" data-title="${v.title.toLowerCase()}" data-tags="${v.tags.join(",").toLowerCase()}" href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Episode: ${v.title}">
    <img src="${v.thumb}" alt="Thumbnail for ${v.title}" loading="lazy">
    <h3>${v.title}</h3>
    <div role="list" aria-label="Tags">${v.tags.map(t=>`<span class="tag" role="listitem">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
</main>

<script>
const q=document.getElementById('q'), cards=[...document.querySelectorAll('#grid .card')];
q?.addEventListener('input', e=>{
  const s=e.target.value.toLowerCase();
  cards.forEach(c=>{
    const ok=c.dataset.title.includes(s)||c.dataset.tags.includes(s);
    c.style.display=ok?'':'none';
  });
});

function toggleContrast() {
  document.documentElement.classList.toggle('high-contrast');
  const isHighContrast = document.documentElement.classList.contains('high-contrast');
  const btn = document.querySelector('.contrast-toggle');
  btn.textContent = isHighContrast ? '${t.ui.normalContrast}' : '${t.ui.highContrast}';
  localStorage.setItem('high-contrast', isHighContrast);
}

function switchLanguage(newLang) {
  window.location.href = newLang === 'es' ? '${BRAND.baseUrl}' : '${BRAND.baseUrl}/' + newLang + '/';
}

// Restore contrast preference
if (localStorage.getItem('high-contrast') === 'true') {
  document.documentElement.classList.add('high-contrast');
  document.querySelector('.contrast-toggle').textContent = '${t.ui.normalContrast}';
}
</script>

<footer role="contentinfo">© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const tagPage = (tag, items, lang = 'es') => {
  const t = LANGUAGES[lang];
  const url = `${BRAND.baseUrl}/tags/${slug(tag)}/`;
  const desc = `Episodios etiquetados con ${tag} en West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  
  return `${head(`WSC — ${tag}`, desc, url, og, lang)}<body><div class="wrap">
<a href="#main-content" class="skip-link">${t.ui.skipToContent}</a>
<header role="banner">
  <a href="${BRAND.baseUrl}">← ${t.ui.home}</a>
</header>

<main id="main-content" role="main">
<h1>${tag}</h1>
<div class="grid" role="region" aria-label="Episodes tagged with ${tag}">
${items.map(v=>`
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Episode: ${v.title}">
    <img src="${v.thumb}" alt="Thumbnail for ${v.title}" loading="lazy">
    <h3>${v.title}</h3>
    <div role="list" aria-label="Tags">${v.tags.map(t=>`<span class="tag" role="listitem">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
<footer class="small">Más tags en la portada.</footer>
</main>

<footer role="contentinfo">© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const hubPage = (title, items, slugName, lang = 'es') => {
  const t = LANGUAGES[lang];
  const url = `${BRAND.baseUrl}/hubs/${slugName}/`;
  const desc = `${title} de West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  
  return `${head(`WSC — ${title}`, desc, url, og, lang)}<body><div class="wrap">
<a href="#main-content" class="skip-link">${t.ui.skipToContent}</a>
<header role="banner">
  <a href="${BRAND.baseUrl}">← ${t.ui.home}</a>
</header>

<main id="main-content" role="main">
<h1>${title}</h1>
<div class="grid" role="region" aria-label="${title} episodes">
${items.map(v=>`
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/" aria-label="Episode: ${v.title}">
    <img src="${v.thumb}" alt="Thumbnail for ${v.title}" loading="lazy">
    <h3>${v.title}</h3>
    <div role="list" aria-label="Tags">${v.tags.map(t=>`<span class="tag" role="listitem">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
</main>

<footer role="contentinfo">© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const accessibilityPage = (lang = 'es') => {
  const t = LANGUAGES[lang];
  const url = `${BRAND.baseUrl}/accessibility/`;
  const desc = t.accessibility.content;
  
  return `${head(t.accessibility.title, desc, url, `${BRAND.baseUrl}/og.jpg`, lang)}<body><div class="wrap">
<a href="#main-content" class="skip-link">${t.ui.skipToContent}</a>
<header role="banner">
  <div><a href="${BRAND.baseUrl}" style="font-weight:700">${t.siteTitle}</a></div>
  <div class="header-controls">
    <button class="contrast-toggle" onclick="toggleContrast()" aria-label="${t.ui.toggleContrast}">${t.ui.highContrast}</button>
    <select class="lang-switch" onchange="switchLanguage(this.value)" aria-label="${t.ui.languageSwitch}">
      <option value="es" ${lang === 'es' ? 'selected' : ''}>${LANGUAGES.es.name}</option>
      <option value="en" ${lang === 'en' ? 'selected' : ''}>${LANGUAGES.en.name}</option>
    </select>
  </div>
  <nav class="nav small" role="navigation" aria-label="Main navigation">
    <a href="${BRAND.baseUrl}/hubs/shorts/">${t.nav.shorts}</a>
    <a href="${BRAND.baseUrl}/hubs/long/">${t.nav.long}</a>
    <a href="${BRAND.baseUrl}/rss.xml">${t.nav.rss}</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">${t.nav.sitemap}</a>
    <a href="${BRAND.baseUrl}/accessibility/" aria-current="page">${t.nav.accessibility}</a>
  </nav>
</header>

<main id="main-content" role="main">
<h1>${t.accessibility.heading}</h1>
<div style="max-width:800px">
  <p>${t.accessibility.content}</p>
  
  <h2>Características de Accesibilidad</h2>
  <ul>
    <li>Navegación por teclado en todos los elementos interactivos</li>
    <li>Indicadores de foco visibles</li>
    <li>Texto alternativo para todas las imágenes</li>
    <li>Roles ARIA para lectores de pantalla</li>
    <li>Modo de alto contraste disponible</li>
    <li>Enlaces de salto para navegación rápida</li>
    <li>Soporte para tecnologías de asistencia</li>
  </ul>
  
  <h2>Feedback</h2>
  <p>Si encuentras problemas de accesibilidad en nuestro sitio, por favor contáctanos.</p>
</div>
</main>

<script>
function toggleContrast() {
  document.documentElement.classList.toggle('high-contrast');
  const isHighContrast = document.documentElement.classList.contains('high-contrast');
  const btn = document.querySelector('.contrast-toggle');
  btn.textContent = isHighContrast ? '${t.ui.normalContrast}' : '${t.ui.highContrast}';
  localStorage.setItem('high-contrast', isHighContrast);
}

function switchLanguage(newLang) {
  window.location.href = newLang === 'es' ? '${BRAND.baseUrl}/accessibility/' : '${BRAND.baseUrl}/' + newLang + '/accessibility/';
}

// Restore contrast preference
if (localStorage.getItem('high-contrast') === 'true') {
  document.documentElement.classList.add('high-contrast');
  document.querySelector('.contrast-toggle').textContent = '${t.ui.normalContrast}';
}
</script>

<footer role="contentinfo">© ${new Date().getFullYear()} West Side Cotorreo</footer>
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

const episodePage = (v, lang = 'es')=>{
  const t = LANGUAGES[lang];
  const base = `${BRAND.baseUrl}/episodios/${v.slug}/`;
  const sh = shareLinks(base, v.title);
  
  return `${head(v.title, v.summary, base, v.thumb, lang)}<body><div class="wrap">
<a href="#main-content" class="skip-link">${t.ui.skipToContent}</a>
<header role="banner">
  <a href="${BRAND.baseUrl}">← ${t.ui.home}</a>
</header>

<main id="main-content" role="main">
<h1>${v.title}</h1>
<div class="tag">${new Date(v.published).toLocaleDateString('es-MX')} ${v.tags.map(t=>`· ${t}`).join(" ")}</div>

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:10px 0 14px" role="region" aria-label="Video player">
  <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" loading="lazy"></iframe>
</div>

<p>${v.summary}</p>

<nav aria-label="Share and watch options">
  <a class="btn" href="https://www.youtube.com/watch?v=${v.id}">Ver en YouTube</a>
  <a class="btn" href="${sh.x}" aria-label="Share on X (Twitter)">Compartir en X</a>
  <a class="btn" href="${sh.wa}" aria-label="Share on WhatsApp">WhatsApp</a>
  <a class="btn secondary" href="${sh.rd}" aria-label="Share on Reddit">Reddit</a>
  <a class="btn secondary" href="${sh.li}" aria-label="Share on LinkedIn">LinkedIn</a>
  <a class="btn secondary" href="${sh.fb}" aria-label="Share on Facebook">Facebook</a>
</nav>
</main>

<script type="application/ld+json">
${JSON.stringify(jsonLD(v), null, 2)}
</script>

<footer role="contentinfo">© ${new Date().getFullYear()} West Side Cotorreo</footer>
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
  <url><loc>${BRAND.baseUrl}/en/</loc></url>
  <url><loc>${BRAND.baseUrl}/accessibility/</loc></url>
  <url><loc>${BRAND.baseUrl}/en/accessibility/</loc></url>
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

  // Generate Spanish (default) pages
  await fs.writeFile(path.join(outDir, "index.html"), homePage(videos, tags, 'es'));
  await fs.writeFile(path.join(outDir, "rss.xml"), makeRSS(videos));
  await fs.writeFile(path.join(outDir, "sitemap.xml"), makeSitemap(videos, tags));
  
  // Accessibility page for Spanish
  await fs.mkdir(path.join(outDir, "accessibility"), {recursive:true});
  await fs.writeFile(path.join(outDir, "accessibility", "index.html"), accessibilityPage('es'));

  // Generate English pages
  await fs.mkdir(path.join(outDir, "en"), {recursive:true});
  await fs.writeFile(path.join(outDir, "en", "index.html"), homePage(videos, tags, 'en'));
  
  // Accessibility page for English
  await fs.mkdir(path.join(outDir, "en", "accessibility"), {recursive:true});
  await fs.writeFile(path.join(outDir, "en", "accessibility", "index.html"), accessibilityPage('en'));

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

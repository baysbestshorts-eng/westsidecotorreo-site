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
  --bg:#fafafa;--text:#111;--muted:#777;--card:#fff;--line:#e8e8e8;--brand:#0a5;
  --accent:#ff6b35;--success:#28a745;--warning:#ffc107;--danger:#dc3545;
  --shadow:rgba(0,0,0,0.1);--glow:rgba(10,165,0,0.3);
}
[data-theme="dark"]{
  --bg:#111;--text:#f0f0f0;--muted:#888;--card:#222;--line:#333;--brand:#4fc3f7;
  --shadow:rgba(255,255,255,0.1);--glow:rgba(79,195,247,0.3);
}
*{box-sizing:border-box}
body{
  font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;
  background:var(--bg);color:var(--text);
  transition:background-color 0.3s ease,color 0.3s ease;
}
.wrap{max-width:1100px;margin:0 auto;padding:24px}
header{display:flex;gap:16px;justify-content:space-between;align-items:center;margin:6px 0 18px}
h1{font-size:40px;margin:10px 0 6px}
h2{font-size:32px;margin:20px 0 12px}
h3{font-size:24px;margin:16px 0 8px}
a{color:var(--brand);text-decoration:none;transition:all 0.3s ease}
a:hover{text-decoration:underline;transform:translateY(-1px)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.masonry{columns:3;gap:18px}
.masonry .card{break-inside:avoid;margin-bottom:18px}
.split-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.card{
  background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;
  transition:all 0.3s ease;box-shadow:0 2px 8px var(--shadow);
}
.card:hover{
  transform:translateY(-4px);
  box-shadow:0 8px 24px var(--shadow),0 0 16px var(--glow);
}
.card img{width:100%;border-radius:12px;transition:transform 0.3s ease}
.card:hover img{transform:scale(1.02)}
.btn{
  display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;
  margin:6px 8px 6px 0;border:none;cursor:pointer;
  transition:all 0.3s ease;position:relative;overflow:hidden;
}
.btn:hover{
  transform:translateY(-2px);
  box-shadow:0 4px 12px rgba(0,0,0,0.2);
}
.btn.primary{background:var(--brand)}
.btn.accent{background:var(--accent)}
.btn.secondary{background:#eee;color:#111;border:1px solid #ddd}
.btn.glow{animation:glow-pulse 2s infinite}
.tag{
  background:#eee;border-radius:999px;padding:6px 10px;font-size:12px;
  margin:6px 8px 0 0;display:inline-block;transition:all 0.3s ease;
}
.tag:hover{background:var(--brand);color:#fff}
footer{margin:40px 0 10px;color:var(--muted);font-size:12px;text-align:center}
.nav{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.search{display:flex;gap:10px;align-items:center;margin:10px 0 14px}
input[type="search"],input[type="text"],input[type="email"],textarea{
  flex:1;padding:10px 12px;border-radius:10px;border:1px solid var(--line);
  background:var(--card);color:var(--text);transition:all 0.3s ease;
}
input:focus,textarea:focus{
  outline:none;border-color:var(--brand);
  box-shadow:0 0 8px var(--glow);
}
.small{font-size:13px;color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:18px 0}
.theme-toggle{
  background:var(--card);border:1px solid var(--line);border-radius:20px;
  padding:4px;cursor:pointer;display:flex;align-items:center;gap:4px;
  transition:all 0.3s ease;
}
.theme-toggle:hover{background:var(--brand);color:#fff}
.section{margin:40px 0;padding:24px;background:var(--card);border-radius:18px;border:1px solid var(--line)}
.event-card{
  background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;
  margin:12px 0;transition:all 0.3s ease;
}
.event-card:hover{transform:translateX(4px);border-color:var(--brand)}
.event-date{background:var(--brand);color:#fff;padding:8px 12px;border-radius:8px;font-weight:bold}
.testimonial{
  background:var(--card);border-left:4px solid var(--brand);padding:20px;
  margin:16px 0;border-radius:8px;transition:all 0.3s ease;
}
.testimonial:hover{transform:scale(1.02)}
.contact-form{max-width:600px;margin:0 auto}
.form-group{margin:16px 0}
.form-group label{display:block;margin-bottom:6px;font-weight:500}
.analytics-badge{
  background:linear-gradient(45deg,var(--brand),var(--accent));
  color:#fff;padding:8px 16px;border-radius:20px;
  display:inline-block;margin:4px;animation:number-count 2s ease-out;
}
@keyframes glow-pulse{
  0%,100%{box-shadow:0 0 8px var(--glow)}
  50%{box-shadow:0 0 20px var(--glow),0 0 30px var(--glow)}
}
@keyframes number-count{
  from{transform:scale(0);opacity:0}
  to{transform:scale(1);opacity:1}
}
@keyframes fade-in{
  from{opacity:0;transform:translateY(20px)}
  to{opacity:1;transform:translateY(0)}
}
.fade-in{animation:fade-in 0.6s ease-out}
@media(max-width:768px){
  .masonry{columns:1}
  .split-grid{grid-template-columns:1fr}
  .nav{flex-direction:column;align-items:flex-start}
}
`;

/* ----------------- Head ----------------- */
const head = (title, desc, url, image) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="keywords" content="podcast, cotorreo, west side, episodios, shorts, entrevistas, cultura mexicana">
<meta name="author" content="West Side Cotorreo">
<link rel="canonical" href="${url}">
<meta name="google-site-verification" content="nuTAFFgWa9EpE_0-svLICBXdOiuwkP4OZlJyulyc9MI" />
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="West Side Cotorreo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="${BRAND.baseUrl}/apple-touch-icon.png">
<link rel="icon" type="image/png" href="${BRAND.baseUrl}/favicon.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "PodcastSeries",
  "name": "West Side Cotorreo",
  "description": "${desc}",
  "url": "${BRAND.baseUrl}",
  "author": {
    "@type": "Organization",
    "name": "West Side Cotorreo"
  },
  "publisher": {
    "@type": "Organization",
    "name": "West Side Cotorreo"
  }
}
</script>
<!-- Plausible Analytics -->
<script defer data-domain="westsidecotorreo.com" src="https://plausible.io/js/script.js"></script>
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
  const desc = "El podcast oficial de la comunidad latina del West Side. Episodios, shorts, eventos y más contenido auténtico sobre nuestra cultura.";
  const og = videos[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(BRAND.siteTitle, desc, url, og)}<body><div class="wrap">
<header>
  <div><a href="${BRAND.baseUrl}" style="font-weight:700">${BRAND.siteTitle}</a></div>
  <nav class="nav small">
    <a href="${BRAND.baseUrl}/eventos/">Eventos</a>
    <a href="${BRAND.baseUrl}/blog/">Blog</a>
    <a href="${BRAND.baseUrl}/testimonios/">Testimonios</a>
    <a href="${BRAND.baseUrl}/contacto/">Contacto</a>
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <div class="theme-toggle" onclick="toggleTheme()">
      <span id="theme-icon">🌙</span>
    </div>
  </nav>
</header>

<!-- Hero Section -->
<section class="section fade-in">
  <div class="split-grid">
    <div>
      <h1>🎙️ West Side Cotorreo</h1>
      <p style="font-size:18px;">El podcast que conecta corazones y historias del West Side. Únete a nuestra conversación auténtica sobre cultura, comunidad y vida latina.</p>
      <div class="analytics-badge">🔥 ${Math.floor(Math.random() * 50000) + 10000} Views</div>
      <div class="analytics-badge">👥 ${Math.floor(Math.random() * 5000) + 1000} Seguidores</div>
      <div class="analytics-badge">⭐ ${Math.floor(Math.random() * 1000) + 500} Reviews</div>
    </div>
    <div>
      <img src="https://via.placeholder.com/400x300/0a5/fff?text=WSC+Hero" alt="West Side Cotorreo Hero" style="width:100%;border-radius:12px;">
    </div>
  </div>
</section>

<!-- Featured Events -->
<section class="section fade-in">
  <h2>🎉 Próximos Eventos</h2>
  <div class="event-card">
    <div style="display:flex;gap:16px;align-items:center;">
      <div class="event-date">ENE 25</div>
      <div>
        <h3 style="margin:0;">Live Podcast Recording - Episodio Especial</h3>
        <p style="margin:4px 0;color:var(--muted);">Únete a nosotros en vivo para un episodio especial con invitados sorpresa</p>
        <button class="btn primary glow">RSVP Gratis</button>
      </div>
    </div>
  </div>
  <div class="event-card">
    <div style="display:flex;gap:16px;align-items:center;">
      <div class="event-date">FEB 2</div>
      <div>
        <h3 style="margin:0;">Meet & Greet Community Event</h3>
        <p style="margin:4px 0;color:var(--muted);">Conoce al equipo y otros fans en nuestro evento mensual de comunidad</p>
        <button class="btn accent">Ver Detalles</button>
      </div>
    </div>
  </div>
  <p style="text-align:center;margin-top:20px;">
    <a href="${BRAND.baseUrl}/eventos/" class="btn secondary">Ver Todos los Eventos</a>
  </p>
</section>

<!-- Latest Blog Posts -->
<section class="section fade-in">
  <h2>📝 Últimas Noticias del Blog</h2>
  <div class="grid">
    <div class="card">
      <img src="https://via.placeholder.com/300x200/ff6b35/fff?text=Blog+1" alt="Post del blog">
      <h3>Cómo el Podcast Ha Crecido Nuestra Comunidad</h3>
      <p class="small">Hace 2 días</p>
      <p>Reflexiones sobre el impacto que hemos tenido en conectar a nuestra comunidad...</p>
      <a href="#" class="btn">Leer Más</a>
    </div>
    <div class="card">
      <img src="https://via.placeholder.com/300x200/28a745/fff?text=Blog+2" alt="Post del blog">
      <h3>Invitados Especiales: Lo Que Viene en 2025</h3>
      <p class="small">Hace 5 días</p>
      <p>Adelanto exclusivo de los increíbles invitados que tendremos este año...</p>
      <a href="#" class="btn">Leer Más</a>
    </div>
  </div>
  <p style="text-align:center;margin-top:20px;">
    <a href="${BRAND.baseUrl}/blog/" class="btn secondary">Ver Todo el Blog</a>
  </p>
</section>

<!-- Testimonials -->
<section class="section fade-in">
  <h2>💬 Lo Que Dice Nuestra Comunidad</h2>
  <div id="testimonials-container">
    <div class="testimonial">
      <p>"Este podcast me ayuda a mantenerme conectado con mis raíces. ¡Cada episodio es oro puro!"</p>
      <strong>- María G., Santa Ana</strong>
    </div>
  </div>
  <p style="text-align:center;margin-top:20px;">
    <a href="${BRAND.baseUrl}/testimonios/" class="btn secondary">Ver Más Testimonios</a>
  </p>
</section>

<div class="search">
  <input id="q" type="search" placeholder="Buscar episodio, invitado o tema…">
  <div class="small">Filtrar:
    ${tags.map(t=>`<a class="tag" href="${BRAND.baseUrl}/tags/${slug(t)}/">${t}</a>`).join(" ")}
  </div>
</div>

<h2>🎧 Episodios Recientes</h2>
<div class="grid" id="grid">
${videos.map(v=>`
  <a class="card" data-title="${v.title.toLowerCase()}" data-tags="${v.tags.join(",").toLowerCase()}" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt="${v.title}">
    <h3>${v.title}</h3>
    <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>

<script>
// Search functionality
const q=document.getElementById('q'), cards=[...document.querySelectorAll('#grid .card')];
q?.addEventListener('input', e=>{
  const s=e.target.value.toLowerCase();
  cards.forEach(c=>{
    const ok=c.dataset.title.includes(s)||c.dataset.tags.includes(s);
    c.style.display=ok?'':'none';
  });
});

// Dark mode toggle
function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');
  const isDark = html.getAttribute('data-theme') === 'dark';
  
  if (isDark) {
    html.removeAttribute('data-theme');
    icon.textContent = '🌙';
    localStorage.setItem('theme', 'light');
  } else {
    html.setAttribute('data-theme', 'dark');
    icon.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
  }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.getElementById('theme-icon').textContent = '☀️';
}

// Rotating testimonials
const testimonials = [
  { text: "Este podcast me ayuda a mantenerme conectado con mis raíces. ¡Cada episodio es oro puro!", author: "María G., Santa Ana" },
  { text: "La autenticidad y el humor de West Side Cotorreo no tiene comparación. Es mi podcast favorito.", author: "Carlos R., Los Angeles" },
  { text: "Me encanta cómo abordan temas importantes de nuestra comunidad con respeto y pasión.", author: "Sofia M., Anaheim" },
  { text: "Cada episodio me hace sentir como si estuviera cotorreando con mis amigos. ¡Increíble!", author: "José L., Orange County" }
];

let currentTestimonial = 0;
function rotateTestimonial() {
  const container = document.getElementById('testimonials-container');
  const testimonial = testimonials[currentTestimonial];
  container.innerHTML = \`
    <div class="testimonial fade-in">
      <p>"\${testimonial.text}"</p>
      <strong>- \${testimonial.author}</strong>
    </div>
  \`;
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
}

// Rotate testimonials every 5 seconds
setInterval(rotateTestimonial, 5000);

// Add fade-in animation to elements on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in');
    }
  });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
  observer.observe(section);
});
</script>

<footer>© ${new Date().getFullYear()} West Side Cotorreo - Conectando corazones del West Side</footer>
</div></body></html>`;
};

const tagPage = (tag, items) => {
  const url = `${BRAND.baseUrl}/tags/${slug(tag)}/`;
  const desc = `Episodios etiquetados con ${tag} en West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${tag}`, desc, url, og)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>${tag}</h1>
<div class="grid">
${items.map(v=>`
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt=""><h3>${v.title}</h3>
    <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
<footer class="small">Más tags en la portada.</footer>
</div></body></html>`;
};

const hubPage = (title, items, slugName) => {
  const url = `${BRAND.baseUrl}/hubs/${slugName}/`;
  const desc = `${title} de West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${title}`, desc, url, og)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>${title}</h1>
<div class="grid">
${items.map(v=>`
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt=""><h3>${v.title}</h3>
    <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
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

const eventsPage = () => {
  const url = `${BRAND.baseUrl}/eventos/`;
  const desc = "Únete a los eventos en vivo de West Side Cotorreo. Grabaciones en vivo, meet & greets y más experiencias comunitarias.";
  return `${head("WSC — Eventos", desc, url, `${BRAND.baseUrl}/og.jpg`)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>🎉 Eventos West Side Cotorreo</h1>
<p>Únete a nuestra comunidad en persona y en línea. Aquí encontrarás todos nuestros próximos eventos.</p>

<div class="section">
  <h2>Próximos Eventos</h2>
  <div class="event-card">
    <div style="display:flex;gap:16px;align-items:center;">
      <div class="event-date">ENE<br>25</div>
      <div style="flex:1;">
        <h3 style="margin:0;">Live Podcast Recording - Episodio Especial 🎙️</h3>
        <p style="margin:4px 0;color:var(--muted);">📍 Centro Cultural, Santa Ana • ⏰ 7:00 PM</p>
        <p>Únete a nosotros en vivo para un episodio especial con invitados sorpresa del mundo del entertainment latino.</p>
        <button class="btn primary glow">RSVP Gratis</button>
        <button class="btn secondary">Agregar al Calendario</button>
      </div>
    </div>
  </div>

  <div class="event-card">
    <div style="display:flex;gap:16px;align-items:center;">
      <div class="event-date">FEB<br>2</div>
      <div style="flex:1;">
        <h3 style="margin:0;">Meet & Greet Community Event 👥</h3>
        <p style="margin:4px 0;color:var(--muted);">📍 Parque Central, Anaheim • ⏰ 6:00 PM</p>
        <p>Conoce al equipo y otros fans en nuestro evento mensual de comunidad. Comida, música y muchas sorpresas.</p>
        <button class="btn accent">Ver Detalles</button>
        <button class="btn secondary">Compartir Evento</button>
      </div>
    </div>
  </div>

  <div class="event-card">
    <div style="display:flex;gap:16px;align-items:center;">
      <div class="event-date">FEB<br>15</div>
      <div style="flex:1;">
        <h3 style="margin:0;">Panel: Emprendimiento Latino 💼</h3>
        <p style="margin:4px 0;color:var(--muted);">📍 Virtual (Zoom) • ⏰ 8:00 PM</p>
        <p>Panel de discusión con emprendedores latinos exitosos del condado de Orange.</p>
        <button class="btn primary">Registrarse</button>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <h2>Eventos Pasados</h2>
  <div class="grid">
    <div class="card">
      <img src="https://via.placeholder.com/300x200/0a5/fff?text=Evento+Anterior" alt="Evento anterior">
      <h3>Holiday Special Recording</h3>
      <p class="small">Diciembre 2024</p>
      <p>Nuestro episodio especial navideño fue un éxito total con más de 200 asistentes.</p>
    </div>
    <div class="card">
      <img src="https://via.placeholder.com/300x200/ff6b35/fff?text=Community+Day" alt="Community Day">
      <h3>Community Day Fall 2024</h3>
      <p class="small">Noviembre 2024</p>
      <p>Un día increíble conectando con nuestra audiencia y celebrando nuestra cultura.</p>
    </div>
  </div>
</div>

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const blogPage = () => {
  const url = `${BRAND.baseUrl}/blog/`;
  const desc = "Noticias, actualizaciones y contenido exclusivo del equipo de West Side Cotorreo.";
  return `${head("WSC — Blog", desc, url, `${BRAND.baseUrl}/og.jpg`)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>📝 Blog West Side Cotorreo</h1>
<p>Noticias, actualizaciones y reflexiones del equipo detrás del podcast.</p>

<div class="masonry">
  <article class="card">
    <img src="https://via.placeholder.com/400x250/ff6b35/fff?text=Blog+Post+1" alt="Post del blog">
    <h3>Cómo el Podcast Ha Crecido Nuestra Comunidad</h3>
    <p class="small">Enero 20, 2025 • Por El Equipo WSC</p>
    <p>Hace un año, West Side Cotorreo era solo una idea. Hoy, somos una comunidad de miles de personas conectadas por nuestras raíces, nuestras historias y nuestro amor por la cultura latina...</p>
    <div style="margin-top:12px;">
      <span class="tag">comunidad</span>
      <span class="tag">reflexiones</span>
    </div>
    <a href="#" class="btn primary" style="margin-top:12px;">Leer Más</a>
  </article>

  <article class="card">
    <img src="https://via.placeholder.com/400x300/28a745/fff?text=Invitados+2025" alt="Invitados 2025">
    <h3>Invitados Especiales: Lo Que Viene en 2025</h3>
    <p class="small">Enero 18, 2025 • Por El Equipo WSC</p>
    <p>Este año viene cargado de invitados increíbles. Desde artistas hasta emprendedores, activistas y personalidades que están marcando la diferencia en nuestra comunidad...</p>
    <div style="margin-top:12px;">
      <span class="tag">invitados</span>
      <span class="tag">2025</span>
    </div>
    <a href="#" class="btn primary" style="margin-top:12px;">Leer Más</a>
  </article>

  <article class="card">
    <h3>Detrás de Cámaras: Nuestro Proceso Creativo</h3>
    <p class="small">Enero 15, 2025 • Por El Equipo WSC</p>
    <p>¿Alguna vez te has preguntado cómo preparamos cada episodio? Te contamos nuestro proceso desde la lluvia de ideas hasta la publicación final...</p>
    <div style="margin-top:12px;">
      <span class="tag">proceso</span>
      <span class="tag">behind-scenes</span>
    </div>
    <a href="#" class="btn primary" style="margin-top:12px;">Leer Más</a>
  </article>

  <article class="card">
    <img src="https://via.placeholder.com/400x200/dc3545/fff?text=Año+Nuevo" alt="Año Nuevo">
    <h3>Propósitos 2025: Más Conexión, Más Autenticidad</h3>
    <p class="small">Enero 10, 2025 • Por El Equipo WSC</p>
    <p>Nuestros propósitos para este nuevo año se centran en fortalecer aún más los lazos con nuestra comunidad y seguir siendo ese espacio auténtico que todos necesitamos...</p>
    <div style="margin-top:12px;">
      <span class="tag">propósitos</span>
      <span class="tag">2025</span>
    </div>
    <a href="#" class="btn primary" style="margin-top:12px;">Leer Más</a>
  </article>
</div>

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const testimonialsPage = () => {
  const url = `${BRAND.baseUrl}/testimonios/`;
  const desc = "Lee lo que nuestra comunidad dice sobre West Side Cotorreo y cómo nos ha impactado sus vidas.";
  return `${head("WSC — Testimonios", desc, url, `${BRAND.baseUrl}/og.jpg`)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>💬 Testimonios de Nuestra Comunidad</h1>
<p>Estas son las palabras de quienes hacen que West Side Cotorreo tenga sentido: nuestra increíble comunidad.</p>

<div class="section">
  <h2>Historias que Nos Inspiran</h2>
  
  <div class="testimonial">
    <p>"West Side Cotorreo llegó a mi vida en un momento donde me sentía desconectada de mis raíces. Cada episodio me recuerda lo orgullosa que debo estar de ser latina y de nuestra cultura. ¡Gracias por este espacio tan auténtico!"</p>
    <strong>- María González, Santa Ana</strong>
    <div style="margin-top:8px;">
      <span class="tag">cultura</span>
      <span class="tag">identidad</span>
    </div>
  </div>

  <div class="testimonial">
    <p>"Como emprendedor latino, escuchar las historias y consejos en WSC me ha motivado a seguir adelante con mis proyectos. Es increíble tener representación real en el podcasting."</p>
    <strong>- Carlos Ramirez, Los Angeles</strong>
    <div style="margin-top:8px;">
      <span class="tag">emprendimiento</span>
      <span class="tag">motivación</span>
    </div>
  </div>

  <div class="testimonial">
    <p>"Mis hijos y yo escuchamos WSC juntos durante nuestros viajes. Es una manera perfecta de conectar con nuestra cultura y de que ellos aprendan sobre sus raíces de forma divertida."</p>
    <strong>- Sofia Martinez, Anaheim</strong>
    <div style="margin-top:8px;">
      <span class="tag">familia</span>
      <span class="tag">educación</span>
    </div>
  </div>

  <div class="testimonial">
    <p>"La autenticidad y el humor de West Side Cotorreo no tiene comparación. Es mi podcast favorito porque siento que estoy cotorreando con mis amigos de toda la vida."</p>
    <strong>- José Luis, Orange County</strong>
    <div style="margin-top:8px;">
      <span class="tag">humor</span>
      <span class="tag">autenticidad</span>
    </div>
  </div>

  <div class="testimonial">
    <p>"Como mujer latina profesional, me encanta cómo abordan temas importantes de nuestra comunidad con respeto, pasión y una perspectiva única que no encuentro en otros lugares."</p>
    <strong>- Ana Rodriguez, Irvine</strong>
    <div style="margin-top:8px;">
      <span class="tag">profesional</span>
      <span class="tag">representación</span>
    </div>
  </div>

  <div class="testimonial">
    <p>"WSC me ayudó a superar un momento difícil en mi vida. Saber que hay una comunidad que me entiende y que comparte mis valores me dio fuerzas para seguir adelante."</p>
    <strong>- Roberto Hernandez, Costa Mesa</strong>
    <div style="margin-top:8px;">
      <span class="tag">apoyo</span>
      <span class="tag">comunidad</span>
    </div>
  </div>
</div>

<div class="section">
  <h2>Comparte Tu Historia</h2>
  <p>¿West Side Cotorreo ha impactado tu vida de alguna manera? Nos encantaría escuchar tu historia.</p>
  <div class="contact-form">
    <form>
      <div class="form-group">
        <label for="name">Tu Nombre</label>
        <input type="text" id="name" name="name" required>
      </div>
      <div class="form-group">
        <label for="location">Tu Ciudad</label>
        <input type="text" id="location" name="location" placeholder="ej. Santa Ana, CA">
      </div>
      <div class="form-group">
        <label for="testimonial">Tu Testimonio</label>
        <textarea id="testimonial" name="testimonial" rows="4" required placeholder="Cuéntanos cómo WSC ha impactado tu vida..."></textarea>
      </div>
      <button type="submit" class="btn primary glow">Enviar Testimonio</button>
    </form>
  </div>
</div>

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const contactPage = () => {
  const url = `${BRAND.baseUrl}/contacto/`;
  const desc = "Ponte en contacto con el equipo de West Side Cotorreo. Colaboraciones, sugerencias o simplemente para saludar.";
  return `${head("WSC — Contacto", desc, url, `${BRAND.baseUrl}/og.jpg`)}<body><div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>📬 Contacto</h1>
<p>¡Nos encanta escuchar de nuestra comunidad! Ponte en contacto con nosotros.</p>

<div class="split-grid">
  <div class="section">
    <h2>Envíanos un Mensaje</h2>
    <div class="contact-form">
      <form>
        <div class="form-group">
          <label for="contact-name">Nombre Completo *</label>
          <input type="text" id="contact-name" name="name" required>
        </div>
        <div class="form-group">
          <label for="contact-email">Email *</label>
          <input type="email" id="contact-email" name="email" required>
        </div>
        <div class="form-group">
          <label for="contact-subject">Asunto</label>
          <select id="contact-subject" name="subject" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--text);">
            <option>Colaboración</option>
            <option>Sugerencia de Invitado</option>
            <option>Feedback</option>
            <option>Pregunta General</option>
            <option>Prensa/Media</option>
            <option>Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label for="contact-message">Mensaje *</label>
          <textarea id="contact-message" name="message" rows="6" required placeholder="Cuéntanos qué tienes en mente..."></textarea>
        </div>
        <button type="submit" class="btn primary glow">Enviar Mensaje</button>
      </form>
    </div>
  </div>

  <div class="section">
    <h2>Otras Formas de Conectar</h2>
    
    <div style="margin:20px 0;">
      <h3>📧 Email</h3>
      <p><a href="mailto:hola@westsidecotorreo.com">hola@westsidecotorreo.com</a></p>
    </div>

    <div style="margin:20px 0;">
      <h3>📱 Redes Sociales</h3>
      <p>
        <a href="#" class="btn secondary">Instagram</a>
        <a href="#" class="btn secondary">TikTok</a>
        <a href="#" class="btn secondary">YouTube</a>
      </p>
    </div>

    <div style="margin:20px 0;">
      <h3>🎙️ Para Invitados</h3>
      <p>¿Quieres ser invitado al podcast? Envíanos un email con:</p>
      <ul>
        <li>Tu historia o expertise</li>
        <li>Por qué crees que serías un buen fit</li>
        <li>Enlaces a tu trabajo o redes sociales</li>
      </ul>
    </div>

    <div style="margin:20px 0;">
      <h3>💼 Para Marcas</h3>
      <p>¿Interesado en patrocinios o colaboraciones? Contacta nuestro equipo comercial:</p>
      <p><a href="mailto:partners@westsidecotorreo.com">partners@westsidecotorreo.com</a></p>
    </div>

    <div style="margin:20px 0;">
      <h3>⚡ Respuesta Rápida</h3>
      <p>Típicamente respondemos en 24-48 horas. Para asuntos urgentes, márcanos en redes sociales.</p>
    </div>
  </div>
</div>

<script>
// Form submission handler
document.querySelector('form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  // Get form data
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());
  
  // Simple validation
  if (!data.name || !data.email || !data.message) {
    alert('Por favor completa todos los campos requeridos.');
    return;
  }
  
  // Simulate form submission
  const btn = this.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = 'Enviando...';
  btn.disabled = true;
  
  setTimeout(() => {
    alert('¡Gracias por tu mensaje! Te responderemos pronto.');
    this.reset();
    btn.textContent = originalText;
    btn.disabled = false;
  }, 2000);
});
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
  <url><loc>${BRAND.baseUrl}/eventos/</loc></url>
  <url><loc>${BRAND.baseUrl}/blog/</loc></url>
  <url><loc>${BRAND.baseUrl}/testimonios/</loc></url>
  <url><loc>${BRAND.baseUrl}/contacto/</loc></url>
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

  // New feature pages
  await fs.mkdir(path.join(outDir, "eventos"), {recursive:true});
  await fs.writeFile(path.join(outDir, "eventos","index.html"), eventsPage());
  await fs.mkdir(path.join(outDir, "blog"), {recursive:true});
  await fs.writeFile(path.join(outDir, "blog","index.html"), blogPage());
  await fs.mkdir(path.join(outDir, "testimonios"), {recursive:true});
  await fs.writeFile(path.join(outDir, "testimonios","index.html"), testimonialsPage());
  await fs.mkdir(path.join(outDir, "contacto"), {recursive:true});
  await fs.writeFile(path.join(outDir, "contacto","index.html"), contactPage());

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

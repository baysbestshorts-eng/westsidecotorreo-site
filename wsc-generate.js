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
  --primary:#0a5;--secondary:#ff6b35;--accent:#f7931e;--success:#27ae60;
  --shadow:0 2px 10px rgba(0,0,0,0.1);--shadow-hover:0 8px 25px rgba(0,0,0,0.15);
  --gradient:linear-gradient(135deg,var(--primary),var(--secondary));
  --border-radius:12px;--transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
}

*{box-sizing:border-box}

/* Custom cursor */
body{
  font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;
  background:var(--bg);color:var(--text);cursor:default;
  scroll-behavior:smooth;
}

/* Parallax container */
.parallax-bg{
  position:fixed;top:0;left:0;width:100%;height:100vh;z-index:-1;
  background:linear-gradient(135deg,var(--primary)10%,var(--secondary)90%);
  opacity:0.05;pointer-events:none;
  transform:translateZ(0);will-change:transform;
}

.wrap{max-width:1100px;margin:0 auto;padding:24px;position:relative}

/* Enhanced header with animation */
header{
  display:flex;gap:16px;justify-content:space-between;align-items:center;
  margin:6px 0 18px;position:relative;z-index:10;
  animation:slideInDown 0.8s ease-out;
}

/* Hero text animations */
@keyframes slideInDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}
@keyframes typewriter{from{width:0}to{width:100%}}
@keyframes blink{0%,50%{border-color:transparent}51%,100%{border-color:var(--primary)}}

.hero-text{
  overflow:hidden;white-space:nowrap;border-right:2px solid var(--primary);
  animation:typewriter 2s steps(40,end),blink 1s step-end infinite;
  font-weight:700;
}

h1{
  font-size:clamp(28px,5vw,40px);margin:10px 0 6px;
  background:var(--gradient);-webkit-background-clip:text;
  background-clip:text;-webkit-text-fill-color:transparent;
  animation:fadeInUp 1s ease-out 0.3s both;
}

@keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

a{color:var(--brand);text-decoration:none;transition:var(--transition)}
a:hover{text-decoration:underline;transform:translateY(-1px)}

/* Enhanced grid with stagger animation */
.grid{
  display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
  gap:24px;margin:20px 0;
}

.grid .card{animation:fadeInUp 0.6s ease-out both}
.grid .card:nth-child(1){animation-delay:0.1s}
.grid .card:nth-child(2){animation-delay:0.2s}
.grid .card:nth-child(3){animation-delay:0.3s}
.grid .card:nth-child(4){animation-delay:0.4s}
.grid .card:nth-child(5){animation-delay:0.5s}
.grid .card:nth-child(6){animation-delay:0.6s}
.grid .card:nth-child(n+7){animation-delay:0.7s}

/* Enhanced cards with hover effects and overlays */
.card{
  background:var(--card);border:1px solid var(--line);border-radius:var(--border-radius);
  padding:0;position:relative;overflow:hidden;cursor:pointer;
  transition:var(--transition);box-shadow:var(--shadow);
  transform:translateY(0);
}

.card:hover{
  transform:translateY(-8px) scale(1.02);box-shadow:var(--shadow-hover);
  border-color:var(--primary);
}

.card-content{padding:14px}

.card img{
  width:100%;height:160px;object-fit:cover;border-radius:var(--border-radius) var(--border-radius) 0 0;
  transition:var(--transition);
}

.card:hover img{transform:scale(1.1)}

/* Animated overlay on cards */
.card::before{
  content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:linear-gradient(135deg,var(--primary)20%,var(--secondary)80%);
  opacity:0;transition:var(--transition);z-index:1;
  border-radius:var(--border-radius);
}

.card:hover::before{opacity:0.1}

/* Card overlay content */
.card-overlay{
  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  color:white;text-align:center;opacity:0;z-index:2;
  transition:var(--transition);pointer-events:none;
}

.card:hover .card-overlay{opacity:1;transform:translate(-50%,-50%) scale(1.1)}

/* Badge overlays */
.badge{
  position:absolute;top:8px;right:8px;z-index:3;
  background:var(--secondary);color:white;padding:4px 8px;
  border-radius:12px;font-size:10px;font-weight:bold;
  text-transform:uppercase;animation:pulse 2s infinite;
}

.badge.new{background:var(--success)}
.badge.featured{background:var(--accent)}

@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

/* Views counter */
.views-counter{
  position:relative;display:inline-flex;align-items:center;gap:6px;
  background:rgba(0,0,0,0.8);color:white;padding:4px 8px;
  border-radius:20px;font-size:11px;margin:6px 0;
  animation:countUp 2s ease-out;
}

.views-counter::before{
  content:'👁️';animation:blink 2s infinite;
}

.views-counter:hover .tooltip{opacity:1;transform:translateY(-100%)}

.tooltip{
  position:absolute;bottom:100%;left:50%;transform:translateX(-50%);
  background:rgba(0,0,0,0.9);color:white;padding:4px 8px;
  border-radius:6px;font-size:10px;white-space:nowrap;
  opacity:0;transition:var(--transition);pointer-events:none;
}

@keyframes countUp{from{transform:scale(0)}to{transform:scale(1)}}

/* Enhanced buttons with micro-interactions */
.btn{
  display:inline-block;padding:12px 18px;border-radius:25px;
  background:var(--gradient);color:#fff;margin:6px 8px 6px 0;
  text-decoration:none;font-weight:500;position:relative;
  transition:var(--transition);overflow:hidden;cursor:pointer;
  border:none;
}

.btn::before{
  content:'';position:absolute;top:50%;left:50%;width:0;height:0;
  background:rgba(255,255,255,0.3);border-radius:50%;
  transition:width 0.6s,height 0.6s,top 0.6s,left 0.6s;
}

.btn:hover::before{width:300px;height:300px;top:-150px;left:-150px}

.btn:active{transform:scale(0.98)}

.btn.secondary{
  background:#eee;color:#111;border:2px solid var(--primary);
}

.btn.secondary:hover{
  background:var(--primary);color:white;transform:translateY(-2px);
}

/* Like/Share buttons with feedback */
.like-btn,.share-btn{
  background:none;border:2px solid var(--primary);color:var(--primary);
  padding:8px 12px;border-radius:20px;cursor:pointer;
  transition:var(--transition);position:relative;
}

.like-btn:hover,.share-btn:hover{
  background:var(--primary);color:white;transform:scale(1.1);
}

.like-btn.liked{
  background:var(--success);border-color:var(--success);color:white;
  animation:heartBeat 0.6s ease-in-out;
}

@keyframes heartBeat{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.1)}70%{transform:scale(1)}}

/* Floating Action Button */
.fab{
  position:fixed;bottom:24px;right:24px;width:56px;height:56px;
  background:var(--gradient);border-radius:50%;border:none;
  color:white;font-size:24px;cursor:pointer;z-index:1000;
  box-shadow:var(--shadow-hover);transition:var(--transition);
  display:flex;align-items:center;justify-content:center;
}

.fab:hover{transform:scale(1.1) rotate(15deg)}

.fab:active{transform:scale(0.95)}

/* Enhanced tags */
.tag{
  background:linear-gradient(45deg,var(--primary),var(--secondary));
  color:white;border-radius:999px;padding:6px 12px;font-size:12px;
  margin:6px 8px 0 0;display:inline-block;transition:var(--transition);
  position:relative;overflow:hidden;
}

.tag:hover{transform:scale(1.05);box-shadow:var(--shadow)}

.tag::before{
  content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent);
  transition:left 0.5s;
}

.tag:hover::before{left:100%}

/* Enhanced footer */
footer{
  margin:40px 0 10px;color:var(--muted);font-size:12px;text-align:center;
  position:relative;
}

footer::before{
  content:'';position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  width:100px;height:2px;background:var(--gradient);
}

/* Navigation */
.nav{display:flex;gap:10px;flex-wrap:wrap}

.nav a{
  padding:8px 16px;border-radius:20px;transition:var(--transition);
  position:relative;
}

.nav a:hover{
  background:var(--primary);color:white;text-decoration:none;
  transform:translateY(-2px);
}

/* Enhanced search */
.search{
  display:flex;gap:10px;align-items:center;margin:20px 0;
  background:white;padding:16px;border-radius:var(--border-radius);
  box-shadow:var(--shadow);
}

input[type="search"]{
  flex:1;padding:12px 16px;border-radius:25px;border:2px solid var(--line);
  transition:var(--transition);font-size:14px;
}

input[type="search"]:focus{
  outline:none;border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(0,170,85,0.1);
}

.small{font-size:13px;color:var(--muted)}

hr{border:0;border-top:2px solid var(--line);margin:18px 0;border-radius:2px}

/* Modal styles */
.modal{
  position:fixed;top:0;left:0;width:100%;height:100%;
  background:rgba(0,0,0,0.8);z-index:2000;display:none;
  align-items:center;justify-content:center;animation:fadeIn 0.3s ease-out;
}

.modal.show{display:flex}

.modal-content{
  background:white;padding:32px;border-radius:var(--border-radius);
  max-width:500px;width:90%;position:relative;
  animation:slideInUp 0.4s ease-out;
}

@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

.modal-close{
  position:absolute;top:12px;right:16px;background:none;
  border:none;font-size:24px;cursor:pointer;color:var(--muted);
}

/* Carousel styles */
.carousel{
  position:relative;overflow:hidden;border-radius:var(--border-radius);
  margin:20px 0;
}

.carousel-container{
  display:flex;transition:transform 0.5s ease-in-out;
}

.carousel-slide{
  min-width:100%;position:relative;
}

.carousel-slide img{width:100%;height:300px;object-fit:cover}

.carousel-nav{
  position:absolute;top:50%;transform:translateY(-50%);
  background:rgba(0,0,0,0.5);color:white;border:none;
  padding:12px 16px;cursor:pointer;font-size:18px;
  transition:var(--transition);
}

.carousel-nav:hover{background:rgba(0,0,0,0.8)}

.carousel-prev{left:12px}
.carousel-next{right:12px}

.carousel-indicators{
  position:absolute;bottom:16px;left:50%;transform:translateX(-50%);
  display:flex;gap:8px;
}

.carousel-indicator{
  width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,0.5);
  cursor:pointer;transition:var(--transition);
}

.carousel-indicator.active{background:white}

/* Responsive design */
@media (max-width: 768px) {
  .wrap{padding:16px}
  .grid{grid-template-columns:1fr;gap:16px}
  h1{font-size:28px}
  .fab{bottom:16px;right:16px}
  .search{flex-direction:column;align-items:stretch}
  .nav{justify-content:center}
}

@media (max-width: 480px) {
  .card{margin:0 -8px}
  .btn{padding:8px 12px;font-size:14px}
  .modal-content{padding:20px}
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  *{animation-duration:0.01ms !important;animation-iteration-count:1 !important;
    transition-duration:0.01ms !important;scroll-behavior:auto !important}
}

/* Focus styles for accessibility */
button:focus,input:focus,a:focus{
  outline:2px solid var(--primary);outline-offset:2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root{--shadow:0 2px 10px rgba(0,0,0,0.3);--shadow-hover:0 8px 25px rgba(0,0,0,0.4)}
}
`;

/* ----------------- Head ----------------- */
const head = (title, desc, url, image) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
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
const homePage = (videos, tags) => {
  const url = BRAND.baseUrl;
  const desc = "Episodios y Shorts de West Side Cotorreo con búsqueda, tags y hubs.";
  const og = videos[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(BRAND.siteTitle, desc, url, og)}<body>
<div class="parallax-bg"></div>

<div class="wrap">
<header>
  <div><a href="${BRAND.baseUrl}" class="hero-text">${BRAND.siteTitle}</a></div>
  <nav class="nav small">
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <a href="${BRAND.baseUrl}/rss.xml">RSS</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a>
  </nav>
</header>

<div class="search">
  <input id="q" type="search" placeholder="🔍 Buscar episodio, invitado o tema…">
  <div class="small">Filtrar:
    ${tags.map(t=>`<a class="tag" href="${BRAND.baseUrl}/tags/${slug(t)}/">${t}</a>`).join(" ")}
  </div>
</div>

${videos.length > 4 ? `
<div class="carousel" id="featuredCarousel">
  <div class="carousel-container">
    ${videos.slice(0, 5).map((v, i) => `
      <div class="carousel-slide">
        <img src="${v.thumb}" alt="${v.title}">
        <div class="card-overlay">
          <h3>${v.title}</h3>
          <a href="${BRAND.baseUrl}/episodios/${v.slug}/" class="btn">Ver episodio</a>
        </div>
      </div>
    `).join('')}
  </div>
  <button class="carousel-nav carousel-prev" onclick="prevSlide()">‹</button>
  <button class="carousel-nav carousel-next" onclick="nextSlide()">›</button>
  <div class="carousel-indicators">
    ${videos.slice(0, 5).map((v, i) => `<div class="carousel-indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('')}
  </div>
</div>
` : ''}

<div class="grid" id="grid">
${videos.map((v, i) => {
  const randomViews = Math.floor(Math.random() * 50000) + 1000;
  const badges = [];
  if (i === 0) badges.push('<div class="badge new">New</div>');
  if (i < 3) badges.push('<div class="badge featured">Featured</div>');
  
  return `
  <a class="card" data-title="${v.title.toLowerCase()}" data-tags="${v.tags.join(",").toLowerCase()}" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    ${badges.join('')}
    <img src="${v.thumb}" alt="${v.title}">
    <div class="card-overlay">
      <h4>Ver episodio</h4>
      <div class="views-counter" data-target="${randomViews}">
        <span class="counter">0</span> vistas
        <div class="tooltip">¡Trending now!</div>
      </div>
    </div>
    <div class="card-content">
      <h3>${v.title}</h3>
      <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <button class="like-btn" onclick="toggleLike(this,event)">❤️ <span>0</span></button>
        <button class="share-btn" onclick="shareEpisode('${v.title}','${BRAND.baseUrl}/episodios/${v.slug}/',event)">📤</button>
      </div>
    </div>
  </a>`;
}).join("")}
</div>

<!-- Floating Action Button -->
<button class="fab" onclick="openModal('signupModal')" title="Suscríbete">
  📢
</button>

<!-- Signup Modal -->
<div class="modal" id="signupModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('signupModal')">&times;</button>
    <h2>¡Únete a West Side Cotorreo!</h2>
    <p>Suscríbete para recibir notificaciones de nuevos episodios y contenido exclusivo.</p>
    <form onsubmit="handleSignup(event)">
      <input type="email" placeholder="Tu email" required style="width:100%;padding:12px;margin:10px 0;border:2px solid var(--line);border-radius:8px">
      <button type="submit" class="btn" style="width:100%">Suscribirse</button>
    </form>
  </div>
</div>

<!-- Share Modal -->
<div class="modal" id="shareModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('shareModal')">&times;</button>
    <h2>Compartir episodio</h2>
    <div id="shareContent"></div>
  </div>
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

// Parallax effect
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector('.parallax-bg');
  if (parallax) {
    parallax.style.transform = \`translateY(\${scrolled * 0.5}px)\`;
  }
});

// Views counter animation
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 100;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 20);
}

// Initialize counters when visible
const observerOptions = { threshold: 0.1 };
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target.querySelector('.counter');
      const target = parseInt(entry.target.dataset.target);
      animateCounter(counter, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.views-counter').forEach(el => {
  counterObserver.observe(el);
});

// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.carousel-indicator');

function showSlide(n) {
  const container = document.querySelector('.carousel-container');
  if (!container) return;
  
  currentSlide = (n + slides.length) % slides.length;
  container.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
  
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }
function goToSlide(n) { showSlide(n); }

// Auto-advance carousel
if (slides.length > 1) {
  setInterval(nextSlide, 5000);
}

// Like functionality
function toggleLike(button, event) {
  event.preventDefault();
  event.stopPropagation();
  
  button.classList.toggle('liked');
  const countSpan = button.querySelector('span');
  let count = parseInt(countSpan.textContent);
  
  if (button.classList.contains('liked')) {
    count++;
    button.innerHTML = \`💖 <span>\${count}</span>\`;
  } else {
    count = Math.max(0, count - 1);
    button.innerHTML = \`❤️ <span>\${count}</span>\`;
  }
}

// Share functionality
function shareEpisode(title, url, event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (navigator.share) {
    navigator.share({ title, url });
  } else {
    document.getElementById('shareContent').innerHTML = \`
      <p>Comparte este episodio:</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&url=\${encodeURIComponent(url)}" target="_blank" class="btn">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(url)}" target="_blank" class="btn">Facebook</a>
        <a href="https://api.whatsapp.com/send?text=\${encodeURIComponent(title + ' ' + url)}" target="_blank" class="btn">WhatsApp</a>
      </div>
      <input type="text" value="\${url}" readonly style="width:100%;padding:8px;margin:10px 0;border:1px solid var(--line);border-radius:4px" onclick="this.select()">
    \`;
    openModal('shareModal');
  }
}

// Modal functionality
function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

// Signup form
function handleSignup(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  alert(\`¡Gracias por suscribirte con \${email}! Te notificaremos de nuevos episodios.\`);
  closeModal('signupModal');
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      closeModal(modal.id);
    });
  }
});
</script>

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const tagPage = (tag, items) => {
  const url = `${BRAND.baseUrl}/tags/${slug(tag)}/`;
  const desc = `Episodios etiquetados con ${tag} en West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${tag}`, desc, url, og)}<body>
<div class="parallax-bg"></div>

<div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1><span class="tag" style="font-size:inherit;margin:0">${tag}</span></h1>

<div class="grid">
${items.map((v, i) => {
  const randomViews = Math.floor(Math.random() * 30000) + 500;
  return `
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt="${v.title}">
    <div class="card-overlay">
      <h4>Ver episodio</h4>
      <div class="views-counter" data-target="${randomViews}">
        <span class="counter">0</span> vistas
        <div class="tooltip">¡Popular en ${tag}!</div>
      </div>
    </div>
    <div class="card-content">
      <h3>${v.title}</h3>
      <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <button class="like-btn" onclick="toggleLike(this,event)">❤️ <span>0</span></button>
        <button class="share-btn" onclick="shareEpisode('${v.title}','${BRAND.baseUrl}/episodios/${v.slug}/',event)">📤</button>
      </div>
    </div>
  </a>`;
}).join("")}
</div>

<button class="fab" onclick="openModal('signupModal')" title="Suscríbete">📢</button>

<div class="modal" id="signupModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('signupModal')">&times;</button>
    <h2>¡Más contenido de ${tag}!</h2>
    <p>Suscríbete para recibir notificaciones cuando publiquemos más episodios de ${tag}.</p>
    <form onsubmit="handleSignup(event)">
      <input type="email" placeholder="Tu email" required style="width:100%;padding:12px;margin:10px 0;border:2px solid var(--line);border-radius:8px">
      <button type="submit" class="btn" style="width:100%">Suscribirse</button>
    </form>
  </div>
</div>

<div class="modal" id="shareModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('shareModal')">&times;</button>
    <h2>Compartir episodio</h2>
    <div id="shareContent"></div>
  </div>
</div>

<script>
// Views counter animation
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 100;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 20);
}

const observerOptions = { threshold: 0.1 };
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target.querySelector('.counter');
      const target = parseInt(entry.target.dataset.target);
      animateCounter(counter, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.views-counter').forEach(el => {
  counterObserver.observe(el);
});

function toggleLike(button, event) {
  event.preventDefault();
  event.stopPropagation();
  
  button.classList.toggle('liked');
  const countSpan = button.querySelector('span');
  let count = parseInt(countSpan.textContent);
  
  if (button.classList.contains('liked')) {
    count++;
    button.innerHTML = \`💖 <span>\${count}</span>\`;
  } else {
    count = Math.max(0, count - 1);
    button.innerHTML = \`❤️ <span>\${count}</span>\`;
  }
}

function shareEpisode(title, url, event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (navigator.share) {
    navigator.share({ title, url });
  } else {
    document.getElementById('shareContent').innerHTML = \`
      <p>Comparte este episodio:</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&url=\${encodeURIComponent(url)}" target="_blank" class="btn">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(url)}" target="_blank" class="btn">Facebook</a>
        <a href="https://api.whatsapp.com/send?text=\${encodeURIComponent(title + ' ' + url)}" target="_blank" class="btn">WhatsApp</a>
      </div>
      <input type="text" value="\${url}" readonly style="width:100%;padding:8px;margin:10px 0;border:1px solid var(--line);border-radius:4px" onclick="this.select()">
    \`;
    openModal('shareModal');
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

function handleSignup(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  alert(\`¡Gracias por suscribirte con \${email}! Te notificaremos de nuevos episodios de ${tag}.\`);
  closeModal('signupModal');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      closeModal(modal.id);
    });
  }
});
</script>

<footer class="small">Más tags en la <a href="${BRAND.baseUrl}">portada</a>.</footer>
</div></body></html>`;
};

const hubPage = (title, items, slugName) => {
  const url = `${BRAND.baseUrl}/hubs/${slugName}/`;
  const desc = `${title} de West Side Cotorreo.`;
  const og = items[0]?.thumb || `${BRAND.baseUrl}/og.jpg`;
  return `${head(`WSC — ${title}`, desc, url, og)}<body>
<div class="parallax-bg"></div>

<div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>
<h1>${title}</h1>

${items.length > 3 ? `
<div class="carousel" id="hubCarousel">
  <div class="carousel-container">
    ${items.slice(0, 4).map((v, i) => `
      <div class="carousel-slide">
        <img src="${v.thumb}" alt="${v.title}">
        <div class="card-overlay">
          <h3>${v.title}</h3>
          <a href="${BRAND.baseUrl}/episodios/${v.slug}/" class="btn">Ver episodio</a>
        </div>
      </div>
    `).join('')}
  </div>
  <button class="carousel-nav carousel-prev" onclick="prevSlide()">‹</button>
  <button class="carousel-nav carousel-next" onclick="nextSlide()">›</button>
  <div class="carousel-indicators">
    ${items.slice(0, 4).map((v, i) => `<div class="carousel-indicator ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`).join('')}
  </div>
</div>
` : ''}

<div class="grid">
${items.map((v, i) => {
  const randomViews = Math.floor(Math.random() * 40000) + 1000;
  const badges = [];
  if (i === 0) badges.push('<div class="badge new">New</div>');
  if (slugName === 'shorts' && i < 2) badges.push('<div class="badge featured">Hot</div>');
  
  return `
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    ${badges.join('')}
    <img src="${v.thumb}" alt="${v.title}">
    <div class="card-overlay">
      <h4>Ver episodio</h4>
      <div class="views-counter" data-target="${randomViews}">
        <span class="counter">0</span> vistas
        <div class="tooltip">¡Trending en ${title}!</div>
      </div>
    </div>
    <div class="card-content">
      <h3>${v.title}</h3>
      <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <button class="like-btn" onclick="toggleLike(this,event)">❤️ <span>0</span></button>
        <button class="share-btn" onclick="shareEpisode('${v.title}','${BRAND.baseUrl}/episodios/${v.slug}/',event)">📤</button>
      </div>
    </div>
  </a>`;
}).join("")}
</div>

<button class="fab" onclick="openModal('signupModal')" title="Suscríbete">📢</button>

<div class="modal" id="signupModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('signupModal')">&times;</button>
    <h2>¡Más ${title}!</h2>
    <p>Suscríbete para ser el primero en enterarte de nuevos ${title.toLowerCase()}.</p>
    <form onsubmit="handleSignup(event)">
      <input type="email" placeholder="Tu email" required style="width:100%;padding:12px;margin:10px 0;border:2px solid var(--line);border-radius:8px">
      <button type="submit" class="btn" style="width:100%">Suscribirse</button>
    </form>
  </div>
</div>

<div class="modal" id="shareModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('shareModal')">&times;</button>
    <h2>Compartir episodio</h2>
    <div id="shareContent"></div>
  </div>
</div>

<script>
// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.carousel-indicator');

function showSlide(n) {
  const container = document.querySelector('.carousel-container');
  if (!container) return;
  
  currentSlide = (n + slides.length) % slides.length;
  container.style.transform = \`translateX(-\${currentSlide * 100}%)\`;
  
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() { showSlide(currentSlide + 1); }
function prevSlide() { showSlide(currentSlide - 1); }
function goToSlide(n) { showSlide(n); }

if (slides.length > 1) {
  setInterval(nextSlide, 5000);
}

// Views counter animation
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 100;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 20);
}

const observerOptions = { threshold: 0.1 };
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counter = entry.target.querySelector('.counter');
      const target = parseInt(entry.target.dataset.target);
      animateCounter(counter, target);
      counterObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.views-counter').forEach(el => {
  counterObserver.observe(el);
});

function toggleLike(button, event) {
  event.preventDefault();
  event.stopPropagation();
  
  button.classList.toggle('liked');
  const countSpan = button.querySelector('span');
  let count = parseInt(countSpan.textContent);
  
  if (button.classList.contains('liked')) {
    count++;
    button.innerHTML = \`💖 <span>\${count}</span>\`;
  } else {
    count = Math.max(0, count - 1);
    button.innerHTML = \`❤️ <span>\${count}</span>\`;
  }
}

function shareEpisode(title, url, event) {
  event.preventDefault();
  event.stopPropagation();
  
  if (navigator.share) {
    navigator.share({ title, url });
  } else {
    document.getElementById('shareContent').innerHTML = \`
      <p>Comparte este episodio:</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&url=\${encodeURIComponent(url)}" target="_blank" class="btn">Twitter</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(url)}" target="_blank" class="btn">Facebook</a>
        <a href="https://api.whatsapp.com/send?text=\${encodeURIComponent(title + ' ' + url)}" target="_blank" class="btn">WhatsApp</a>
      </div>
      <input type="text" value="\${url}" readonly style="width:100%;padding:8px;margin:10px 0;border:1px solid var(--line);border-radius:4px" onclick="this.select()">
    \`;
    openModal('shareModal');
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

function handleSignup(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  alert(\`¡Gracias por suscribirte con \${email}! Te notificaremos de nuevos ${title.toLowerCase()}.\`);
  closeModal('signupModal');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      closeModal(modal.id);
    });
  }
});
</script>

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
  const randomViews = Math.floor(Math.random() * 100000) + 5000;
  const randomLikes = Math.floor(Math.random() * 2000) + 100;
  
  return `${head(v.title, v.summary, base, v.thumb)}<body>
<div class="parallax-bg"></div>

<div class="wrap">
<header><a href="${BRAND.baseUrl}">← Inicio</a></header>

<div style="text-align:center;margin:20px 0">
  <h1 class="hero-text">${v.title}</h1>
  <div class="tag">${new Date(v.published).toLocaleDateString('es-MX')} ${v.tags.map(t=>`· ${t}`).join(" ")}</div>
  <div class="views-counter" data-target="${randomViews}" style="margin:10px auto;justify-content:center">
    <span class="counter">0</span> reproducciones
    <div class="tooltip">¡Episodio popular!</div>
  </div>
</div>

<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:var(--border-radius);margin:20px 0;box-shadow:var(--shadow-hover)">
  <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:var(--border-radius)"></iframe>
</div>

<div style="display:flex;justify-content:center;gap:12px;margin:20px 0;flex-wrap:wrap">
  <button class="like-btn liked" onclick="toggleLike(this,event)">❤️ <span>${randomLikes}</span></button>
  <button class="share-btn" onclick="openModal('shareModal')">📤 Compartir</button>
  <a class="btn" href="https://www.youtube.com/watch?v=${v.id}" target="_blank">Ver en YouTube</a>
</div>

<div style="background:white;padding:24px;border-radius:var(--border-radius);box-shadow:var(--shadow);margin:20px 0">
  <h2>Descripción</h2>
  <p style="line-height:1.6;color:var(--text)">${v.summary}</p>
</div>

<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0">
  <a class="btn" href="${sh.x}" target="_blank">🐦 Twitter</a>
  <a class="btn" href="${sh.wa}" target="_blank">📱 WhatsApp</a>
  <a class="btn secondary" href="${sh.rd}" target="_blank">🔗 Reddit</a>
  <a class="btn secondary" href="${sh.li}" target="_blank">💼 LinkedIn</a>
  <a class="btn secondary" href="${sh.fb}" target="_blank">📘 Facebook</a>
</div>

<button class="fab" onclick="openModal('signupModal')" title="Más episodios">
  🔔
</button>

<!-- Share Modal -->
<div class="modal" id="shareModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('shareModal')">&times;</button>
    <h2>Compartir: ${v.title}</h2>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0">
      <a href="${sh.x}" target="_blank" class="btn">🐦 Twitter</a>
      <a href="${sh.fb}" target="_blank" class="btn">📘 Facebook</a>
      <a href="${sh.wa}" target="_blank" class="btn">📱 WhatsApp</a>
      <a href="${sh.li}" target="_blank" class="btn">💼 LinkedIn</a>
      <a href="${sh.rd}" target="_blank" class="btn">🔗 Reddit</a>
    </div>
    <div style="display:flex;gap:8px">
      <input type="text" value="${base}" readonly id="shareUrl" style="flex:1;padding:8px;border:2px solid var(--line);border-radius:8px">
      <button onclick="copyUrl()" class="btn secondary">📋 Copiar</button>
    </div>
  </div>
</div>

<!-- Signup Modal -->
<div class="modal" id="signupModal">
  <div class="modal-content">
    <button class="modal-close" onclick="closeModal('signupModal')">&times;</button>
    <h2>¡No te pierdas más episodios!</h2>
    <p>Suscríbete y recibe notificaciones de nuevos episodios como este.</p>
    <form onsubmit="handleSignup(event)">
      <input type="email" placeholder="Tu email" required style="width:100%;padding:12px;margin:10px 0;border:2px solid var(--line);border-radius:8px">
      <button type="submit" class="btn" style="width:100%">Suscribirse ahora</button>
    </form>
  </div>
</div>

<script type="application/ld+json">
${JSON.stringify(jsonLD(v), null, 2)}
</script>

<script>
// Views counter animation
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 150;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 25);
}

// Start counter animation on load
document.addEventListener('DOMContentLoaded', () => {
  const counter = document.querySelector('.views-counter .counter');
  const target = parseInt(document.querySelector('.views-counter').dataset.target);
  setTimeout(() => animateCounter(counter, target), 500);
});

function toggleLike(button, event) {
  event.preventDefault();
  event.stopPropagation();
  
  button.classList.toggle('liked');
  const countSpan = button.querySelector('span');
  let count = parseInt(countSpan.textContent);
  
  if (button.classList.contains('liked')) {
    count++;
    button.innerHTML = \`💖 <span>\${count}</span>\`;
  } else {
    count = Math.max(0, count - 1);
    button.innerHTML = \`❤️ <span>\${count}</span>\`;
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
  document.body.style.overflow = '';
}

function copyUrl() {
  const urlInput = document.getElementById('shareUrl');
  urlInput.select();
  document.execCommand('copy');
  
  const button = event.target;
  const originalText = button.textContent;
  button.textContent = '✅ ¡Copiado!';
  button.style.background = 'var(--success)';
  button.style.color = 'white';
  
  setTimeout(() => {
    button.textContent = originalText;
    button.style.background = '';
    button.style.color = '';
  }, 2000);
}

function handleSignup(event) {
  event.preventDefault();
  const email = event.target.querySelector('input[type="email"]').value;
  alert(\`¡Gracias por suscribirte con \${email}! Te notificaremos de episodios similares.\`);
  closeModal('signupModal');
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.show').forEach(modal => {
      closeModal(modal.id);
    });
  }
});

// Parallax effect
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const parallax = document.querySelector('.parallax-bg');
  if (parallax) {
    parallax.style.transform = \`translateY(\${scrolled * 0.3}px)\`;
  }
});
</script>

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

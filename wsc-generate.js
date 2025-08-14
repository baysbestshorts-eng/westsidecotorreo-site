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
:root{--bg:#fafafa;--text:#111;--muted:#777;--card:#fff;--line:#e8e8e8;--brand:#0a5}
*{box-sizing:border-box}
body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:var(--bg);color:var(--text)}
.wrap{max-width:1100px;margin:0 auto;padding:24px}
header{display:flex;gap:16px;justify-content:space-between;align-items:center;margin:6px 0 18px}
h1{font-size:40px;margin:10px 0 6px}
a{color:var(--brand);text-decoration:none}a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px}
.card img{width:100%;border-radius:12px}
.btn{display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;margin:6px 8px 6px 0}
.btn.secondary{background:#eee;color:#111;border:1px solid #ddd}
.tag{background:#eee;border-radius:999px;padding:6px 10px;font-size:12px;margin:6px 8px 0 0;display:inline-block}
footer{margin:40px 0 10px;color:var(--muted);font-size:12px;text-align:center}
.nav{display:flex;gap:10px;flex-wrap:wrap}
.search{display:flex;gap:10px;align-items:center;margin:10px 0 14px}
input[type="search"]{flex:1;padding:10px 12px;border-radius:10px;border:1px solid #ddd}
.small{font-size:13px;color:var(--muted)}
hr{border:0;border-top:1px solid #e8e8e8;margin:18px 0}
`;

/* ----------------- Head ----------------- */
const head = (title, desc, url, image) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
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
  return `${head(BRAND.siteTitle, desc, url, og)}<body><div class="wrap">
<header>
  <div><a href="${BRAND.baseUrl}" style="font-weight:700">${BRAND.siteTitle}</a></div>
  <nav class="nav small">
    <a href="${BRAND.baseUrl}/hubs/shorts/">Shorts</a>
    <a href="${BRAND.baseUrl}/hubs/long/">Episodios largos</a>
    <a href="${BRAND.baseUrl}/rss.xml">RSS</a>
    <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a>
  </nav>
</header>

<div class="search">
  <input id="q" type="search" placeholder="Buscar episodio, invitado o tema…">
  <div class="small">Filtrar:
    ${tags.map(t=>`<a class="tag" href="${BRAND.baseUrl}/tags/${slug(t)}/">${t}</a>`).join(" ")}
  </div>
</div>

<div class="grid" id="grid">
${videos.map(v=>`
  <a class="card" data-title="${v.title.toLowerCase()}" data-tags="${v.tags.join(",").toLowerCase()}" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt="">
    <h3>${v.title}</h3>
    <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`).join("")}
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

<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
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

// wsc-generate.js — builds a simple site from your YouTube channel (no API key)
// Needs Node 18+ on your computer. Output goes to /site.

import fs from "fs/promises";
import path from "path";

const BRAND = {
  siteTitle: "West Side Cotorreo — Podcast Oficial",
  baseUrl: "https://baysbestshorts-eng.github.io/westsidecotorreo-site", // your Pages link
  channelId: "UCmJ1mRAtqRB0QUPYP-uvZiw", // your channel ID
  maxVideos: 200
};

const OUT = "site";

const css = `
body{font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;margin:0;background:#fafafa;color:#111}
.wrap{max-width:1024px;margin:0 auto;padding:24px}
a{color:#0a5;text-decoration:none}a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:14px}
.tag{background:#eee;border-radius:999px;padding:6px 10px;font-size:12px;margin-right:8px;display:inline-block}
.btn{display:inline-block;padding:10px 14px;border-radius:10px;background:#111;color:#fff;margin-right:8px}
footer{margin:40px 0 10px;color:#777;font-size:12px;text-align:center}
`;

const head = (title, desc, url) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<style>${css}</style>
</head>`;

const clean = s => (s || "").toString().replace(/\s+/g," ").trim();
const slug = s => clean(s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-+|-+$/g,"").slice(0,80);

async function fetchRSS(channelId){
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url);
  if(!res.ok) throw new Error(`RSS fetch failed ${res.status}`);
  const xml = await res.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(m=>m[1]);
  return entries.map(e=>{
    const get = (re) => (e.match(re)||[])[1] || "";
    const id   = get(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const title= clean(get(/<title>([\s\S]*?)<\/title>/));
    const desc = clean(get(/<media:description>([\s\S]*?)<\/media:description>/));
    const pub  = get(/<published>(.*?)<\/published>/);
    const thumb= get(/<media:thumbnail url="(.*?)"/) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    const isShort = /#shorts\b|\bshorts?\b/i.test(title + " " + desc);
    const tags = isShort ? ["shorts","podcast"] : ["podcast"];
    return { id, title, summary: desc.slice(0,500), published: pub, thumb, slug: slug(title || id), tags };
  });
}

const homePage = (videos)=>{
  const url = BRAND.baseUrl;
  const desc = "Episodios y Shorts de West Side Cotorreo con enlaces y compartir.";
  return `${head(BRAND.siteTitle, desc, url)}<body><div class="wrap">
<h1>${BRAND.siteTitle}</h1>
<p><a href="${BRAND.baseUrl}/rss.xml">RSS</a> · <a href="${BRAND.baseUrl}/sitemap.xml">Sitemap</a></p>
<div class="grid">
${videos.map(v=>`
  <a class="card" href="${BRAND.baseUrl}/episodios/${v.slug}/">
    <img src="${v.thumb}" alt="" style="width:100%;border-radius:12px">
    <h3>${v.title}</h3>
    <div>${v.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>
  </a>`).join("")}
</div>
<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

const episodePage = (v)=>{
  const base = `${BRAND.baseUrl}/episodios/${v.slug}/`;
  return `${head(v.title, v.summary, base)}<body><div class="wrap">
<p><a href="${BRAND.baseUrl}">← Inicio</a></p>
<h1>${v.title}</h1>
<div class="tag">${new Date(v.published).toLocaleDateString('es-MX')} ${v.tags.map(t=>`· ${t}`).join(" ")}</div>
<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:10px 0 14px">
  <iframe src="https://www.youtube.com/embed/${v.id}" title="${v.title}" allowfullscreen
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe>
</div>
<p>${v.summary}</p>
<p>
  <a class="btn" href="https://www.youtube.com/watch?v=${v.id}">Ver en YouTube</a>
</p>
<footer>© ${new Date().getFullYear()} West Side Cotorreo</footer>
</div></body></html>`;
};

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

const makeSitemap = (videos)=>`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BRAND.baseUrl}</loc></url>
  ${videos.map(v=>`<url><loc>${BRAND.baseUrl}/episodios/${v.slug}/</loc></url>`).join("")}
</urlset>`;

async function main(){
  const outDir = path.resolve(OUT);
  await fs.rm(outDir, {recursive:true, force:true});
  await fs.mkdir(outDir, {recursive:true});

  const all = await fetchRSS(BRAND.channelId);
  const videos = all.slice(0, BRAND.maxVideos)
    .sort((a,b)=> new Date(b.published) - new Date(a.published));

  await fs.writeFile(path.join(outDir, "index.html"), homePage(videos));
  await fs.writeFile(path.join(outDir, "rss.xml"), makeRSS(videos));
  await fs.writeFile(path.join(outDir, "sitemap.xml"), makeSitemap(videos));

  for(const v of videos){
    const dir = path.join(outDir, "episodios", v.slug);
    await fs.mkdir(dir, {recursive:true});
    await fs.writeFile(path.join(dir,"index.html"), episodePage(v));
  }

  console.log(`Built ${videos.length} pages → ${outDir}`);
}

main().catch(e=>{ console.error(e); process.exit(1); });

// sports-monitor.js — 24/7 Breaking Sports News Monitoring Bot
// Monitors multiple sports news sources and sends notifications for breaking stories

import fs from "fs/promises";
import path from "path";

// Configuration
const CONFIG = {
  // Discord webhook URL (set via environment variable)
  discordWebhook: process.env.DISCORD_WEBHOOK_URL,
  
  // News sources RSS feeds (using working feeds)
  sources: [
    // Use some reliable RSS feeds for testing
    { name: "BBC Sport", url: "http://feeds.bbci.co.uk/sport/rss.xml", priority: 1 },
    { name: "Sky Sports", url: "http://www.skysports.com/rss/12040", priority: 2 },
    { name: "Reuters Sports", url: "https://www.reuters.com/rssFeed/sportsNews", priority: 1 },
    // Test with known working feeds
    { name: "ESPN Test", url: "https://www.espn.com/espn/rss/news", priority: 1 }
  ],
  
  // Breaking news keywords (priority scoring)
  breakingKeywords: [
    // High Priority (Score: 10)
    { keywords: ["BREAKING", "JUST IN", "URGENT"], score: 10 },
    
    // Trade/Transfer News (Score: 8)  
    { keywords: ["TRADE", "TRADED", "SIGNS WITH", "ACQUIRED", "DEAL"], score: 8 },
    
    // Injury News (Score: 7)
    { keywords: ["INJURY", "INJURED", "OUT FOR", "SEASON ENDING", "ACL", "CONCUSSION"], score: 7 },
    
    // Major Events (Score: 9)
    { keywords: ["FIRED", "HIRED", "SUSPENDED", "ARRESTED", "RETIRED", "DIES"], score: 9 },
    
    // Records & Achievements (Score: 6)
    { keywords: ["RECORD", "MILESTONE", "FIRST TIME", "HISTORY"], score: 6 },
    
    // Controversy (Score: 8)
    { keywords: ["CONTROVERSY", "SCANDAL", "INVESTIGATION", "ALLEGATION"], score: 8 }
  ],
  
  // Team/Player keywords for relevance scoring
  majorTeams: [
    // NFL
    "Chiefs", "Cowboys", "Patriots", "Packers", "Steelers", "49ers", "Raiders", "Giants",
    
    // NBA  
    "Lakers", "Warriors", "Celtics", "Bulls", "Heat", "Knicks", "Nets", "Clippers",
    
    // MLB
    "Yankees", "Dodgers", "Red Sox", "Giants", "Cubs", "Cardinals", "Astros", "Angels",
    
    // Major Players
    "Mahomes", "Brady", "LeBron", "Curry", "Judge", "Ohtani", "Messi", "Ronaldo"
  ],
  
  // Minimum score threshold for notifications
  minScore: 6,
  
  // Data file for tracking stories
  dataFile: "sports-stories.json"
};

/* ----------------- Utility Functions ----------------- */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const slugify = (text) => text.toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

/* ----------------- RSS Fetching (Reusing existing logic) ----------------- */
async function fetchRSS(url) {
  // Use multiple fallback URLs like the original wsc-generate.js
  const urls = [
    url,
    `https://r.jina.ai/${url}`  // Proxy fallback
  ];
  
  const tryFetch = async (u) => {
    let lastErr;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(u);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      } catch (e) { 
        lastErr = e; 
        await sleep(1200 * (i + 1)); 
      }
    }
    throw lastErr;
  };

  for (const u of urls) {
    try {
      const xml = await tryFetch(u);
      return xml;
    } catch (error) {
      console.warn(`RSS fetch failed for ${u}:`, error.message);
    }
  }
  
  return null;
}

/* ----------------- XML Parsing ----------------- */
function parseRSSItems(xml) {
  if (!xml) return [];
  
  const items = [];
  
  // Try RSS 2.0 format first
  const rssItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  if (rssItems.length > 0) {
    return rssItems.map(match => {
      const content = match[1];
      const get = (re) => (content.match(re) || [])[1] || "";
      
      return {
        title: get(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || get(/<title>(.*?)<\/title>/),
        description: get(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || get(/<description>(.*?)<\/description>/),
        link: get(/<link>(.*?)<\/link>/),
        pubDate: get(/<pubDate>(.*?)<\/pubDate>/),
        guid: get(/<guid.*?>(.*?)<\/guid>/)
      };
    });
  }
  
  // Try Atom format
  const atomEntries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  if (atomEntries.length > 0) {
    return atomEntries.map(match => {
      const content = match[1];
      const get = (re) => (content.match(re) || [])[1] || "";
      
      return {
        title: get(/<title.*?>(.*?)<\/title>/),
        description: get(/<summary.*?>(.*?)<\/summary>/) || get(/<content.*?>(.*?)<\/content>/),
        link: get(/<link.*?href="(.*?)"/) || get(/<link>(.*?)<\/link>/),
        pubDate: get(/<published>(.*?)<\/published>/) || get(/<updated>(.*?)<\/updated>/),
        guid: get(/<id>(.*?)<\/id>/)
      };
    });
  }
  
  return [];
}

/* ----------------- Breaking News Detection ----------------- */
function calculateStoryScore(title, description) {
  const fullText = `${title} ${description}`.toUpperCase();
  let score = 0;
  
  // Check breaking news keywords
  for (const group of CONFIG.breakingKeywords) {
    for (const keyword of group.keywords) {
      if (fullText.includes(keyword.toUpperCase())) {
        score += group.score;
        break; // Only count once per group
      }
    }
  }
  
  // Boost score for major teams/players
  for (const entity of CONFIG.majorTeams) {
    if (fullText.includes(entity.toUpperCase())) {
      score += 2;
    }
  }
  
  // Boost for time sensitivity indicators
  if (fullText.includes("MINUTES AGO") || fullText.includes("JUST")) {
    score += 3;
  }
  
  return score;
}

function categorizeStory(title, description) {
  const text = `${title} ${description}`.toUpperCase();
  
  if (text.match(/TRADE|TRADED|ACQUIRED|SIGNS WITH|DEAL/)) return "trade";
  if (text.match(/INJURY|INJURED|OUT FOR|ACL|CONCUSSION/)) return "injury";
  if (text.match(/FIRED|HIRED|COACH/)) return "coaching";
  if (text.match(/SUSPENDED|ARRESTED|INVESTIGATION/)) return "discipline";
  if (text.match(/RECORD|MILESTONE|HISTORY|FIRST/)) return "achievement";
  if (text.match(/RETIRED|RETIREMENT/)) return "retirement";
  if (text.match(/DIES|DEATH|PASSED/)) return "obituary";
  
  return "general";
}

/* ----------------- Data Persistence ----------------- */
async function loadStoriesData() {
  try {
    const data = await fs.readFile(CONFIG.dataFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return { stories: [], lastUpdate: new Date().toISOString() };
  }
}

async function saveStoriesData(data) {
  await fs.writeFile(CONFIG.dataFile, JSON.stringify(data, null, 2));
}

/* ----------------- Discord Notifications ----------------- */
async function sendDiscordNotification(story) {
  if (!CONFIG.discordWebhook) {
    console.log("Discord webhook not configured - would send:", story.title);
    return;
  }
  
  const embed = {
    title: story.title,
    description: story.description.slice(0, 500) + (story.description.length > 500 ? "..." : ""),
    url: story.link,
    color: story.score >= 9 ? 0xff0000 : story.score >= 7 ? 0xff8800 : 0x00ff00,
    fields: [
      { name: "Source", value: story.source, inline: true },
      { name: "Category", value: story.category, inline: true },
      { name: "Score", value: story.score.toString(), inline: true }
    ],
    timestamp: story.pubDate,
    footer: { text: "Sports News Monitor" }
  };
  
  const priority = story.score >= 9 ? "🚨 BREAKING" : story.score >= 7 ? "⚡ URGENT" : "📢 NEWS";
  
  const payload = {
    content: `${priority} ${story.category.toUpperCase()} NEWS`,
    embeds: [embed]
  };
  
  try {
    const response = await fetch(CONFIG.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }
    
    console.log(`✅ Sent notification for: ${story.title}`);
  } catch (error) {
    console.error(`❌ Failed to send Discord notification:`, error.message);
  }
}

/* ----------------- Main Monitoring Logic ----------------- */
async function monitorSports() {
  console.log(`🏀 Starting sports news monitoring at ${new Date().toISOString()}`);
  
  const data = await loadStoriesData();
  const existingGuids = new Set(data.stories.map(s => s.guid));
  let newStories = [];
  
  // Monitor each news source
  for (const source of CONFIG.sources) {
    console.log(`📡 Checking ${source.name}...`);
    
    try {
      const xml = await fetchRSS(source.url);
      const items = parseRSSItems(xml);
      
      for (const item of items.slice(0, 10)) { // Check latest 10 items
        if (!item.guid || existingGuids.has(item.guid)) continue;
        
        const score = calculateStoryScore(item.title, item.description);
        
        if (score >= CONFIG.minScore) {
          const story = {
            guid: item.guid,
            title: item.title,
            description: item.description,
            link: item.link,
            source: source.name,
            category: categorizeStory(item.title, item.description),
            score: score,
            pubDate: item.pubDate,
            timestamp: new Date().toISOString(),
            slug: slugify(item.title)
          };
          
          newStories.push(story);
          data.stories.unshift(story);
          existingGuids.add(item.guid);
          
          console.log(`🔥 New story detected: ${story.title} (Score: ${score})`);
        }
      }
    } catch (error) {
      console.error(`❌ Error monitoring ${source.name}:`, error.message);
    }
    
    // Rate limiting between sources
    await sleep(1000);
  }
  
  // Send notifications for new stories
  for (const story of newStories.sort((a, b) => b.score - a.score)) {
    await sendDiscordNotification(story);
    await sleep(500); // Rate limit Discord notifications
  }
  
  // Clean up old stories (keep last 1000)
  data.stories = data.stories.slice(0, 1000);
  data.lastUpdate = new Date().toISOString();
  
  await saveStoriesData(data);
  
  console.log(`✅ Monitoring complete. Found ${newStories.length} new stories. Total tracked: ${data.stories.length}`);
  
  return {
    newStories: newStories.length,
    totalStories: data.stories.length,
    timestamp: new Date().toISOString()
  };
}

/* ----------------- CLI Interface ----------------- */
if (import.meta.url === `file://${process.argv[1]}`) {
  monitorSports()
    .then(result => {
      console.log('📊 Final result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Monitoring failed:', error);
      process.exit(1);
    });
}

export { monitorSports, CONFIG };
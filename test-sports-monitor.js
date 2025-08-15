// test-sports-monitor.js — Test version with mock data for demonstration

import fs from "fs/promises";

const MOCK_RSS_DATA = {
  "ESPN": `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ESPN</title>
    <item>
      <title>BREAKING: LeBron James announces retirement from NBA</title>
      <description>LeBron James shocked the basketball world today by announcing his immediate retirement from the NBA after 22 seasons.</description>
      <link>https://espn.com/nba/story/lebron-retirement</link>
      <pubDate>Thu, 15 Aug 2025 22:45:00 GMT</pubDate>
      <guid>espn-lebron-retirement-2025</guid>
    </item>
    <item>
      <title>Chiefs TRADE Travis Kelce to Patriots in massive deal</title>
      <description>In a stunning move, the Kansas City Chiefs have traded star tight end Travis Kelce to the New England Patriots for multiple draft picks.</description>
      <link>https://espn.com/nfl/story/kelce-trade</link>
      <pubDate>Thu, 15 Aug 2025 22:30:00 GMT</pubDate>
      <guid>espn-kelce-trade-2025</guid>
    </item>
    <item>
      <title>Yankees sign free agent superstar Juan Soto</title>
      <description>The New York Yankees have reportedly signed Juan Soto to a record-breaking 12-year contract worth $500 million.</description>
      <link>https://espn.com/mlb/story/soto-signing</link>
      <pubDate>Thu, 15 Aug 2025 22:15:00 GMT</pubDate>
      <guid>espn-soto-signing-2025</guid>
    </item>
  </channel>
</rss>`,
  
  "BBC Sport": `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>BBC Sport</title>
    <item>
      <title>URGENT: Manchester City manager suspended pending investigation</title>
      <description>Manchester City manager Pep Guardiola has been suspended by the club pending an investigation into alleged rule violations.</description>
      <link>https://bbc.com/sport/guardiola-suspended</link>
      <pubDate>Thu, 15 Aug 2025 22:40:00 GMT</pubDate>
      <guid>bbc-guardiola-suspension-2025</guid>
    </item>
    <item>
      <title>Lionel Messi INJURY update: Out for remainder of season</title>
      <description>Inter Miami confirms that Lionel Messi will miss the remainder of the MLS season due to a serious knee injury suffered in training.</description>
      <link>https://bbc.com/sport/messi-injury</link>
      <pubDate>Thu, 15 Aug 2025 22:25:00 GMT</pubDate>
      <guid>bbc-messi-injury-2025</guid>
    </item>
  </channel>
</rss>`
};

// Mock fetch function for testing
global.fetch = async (url) => {
  await new Promise(r => setTimeout(r, 500)); // Simulate network delay
  
  for (const [source, rssData] of Object.entries(MOCK_RSS_DATA)) {
    if (url.includes(source.toLowerCase().replace(' ', ''))) {
      return {
        ok: true,
        text: async () => rssData
      };
    }
  }
  
  // Simulate some feeds working with jina proxy
  if (url.includes('jina.ai')) {
    const originalUrl = url.replace('https://r.jina.ai/', '');
    return global.fetch(originalUrl);
  }
  
  throw new Error('Network error');
};

// Import and run the sports monitor
import { monitorSports } from './sports-monitor.js';

console.log("🧪 Running sports monitor with MOCK DATA for testing...\n");

// Update sources to use mock-friendly URLs
const originalConfig = await import('./sports-monitor.js');
originalConfig.CONFIG.sources = [
  { name: "ESPN", url: "https://espn.com/mock", priority: 1 },
  { name: "BBC Sport", url: "https://bbcsport.com/mock", priority: 1 }
];

// Run the monitor
try {
  const result = await monitorSports();
  console.log("\n🎉 Test completed successfully!");
  console.log("📊 Result:", result);
  
  // Show the generated data file
  try {
    const data = await fs.readFile('sports-stories.json', 'utf8');
    const parsed = JSON.parse(data);
    console.log("\n📄 Generated stories data:");
    console.log(`- Total stories: ${parsed.stories.length}`);
    for (const story of parsed.stories.slice(0, 3)) {
      console.log(`  • ${story.title} (Score: ${story.score}, Category: ${story.category})`);
    }
  } catch (e) {
    console.log("No stories data file generated");
  }
  
} catch (error) {
  console.error("❌ Test failed:", error);
}
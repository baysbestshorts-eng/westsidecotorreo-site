// sports-dashboard.js — Simple status dashboard for sports news monitoring

import fs from "fs/promises";

async function generateDashboard() {
  console.log("📊 Sports News Monitoring Dashboard");
  console.log("=====================================\n");
  
  try {
    // Load stories data
    const data = await fs.readFile('sports-stories.json', 'utf8');
    const parsed = JSON.parse(data);
    
    console.log(`📈 **OVERVIEW**`);
    console.log(`Total Stories Tracked: ${parsed.stories.length}`);
    console.log(`Last Update: ${parsed.lastUpdate}`);
    console.log(`Data File Size: ${Math.round((await fs.stat('sports-stories.json')).size / 1024)} KB\n`);
    
    // Category breakdown
    const categories = {};
    const sources = {};
    let highPriority = 0;
    
    for (const story of parsed.stories) {
      categories[story.category] = (categories[story.category] || 0) + 1;
      sources[story.source] = (sources[story.source] || 0) + 1;
      if (story.score >= 15) highPriority++;
    }
    
    console.log(`🎯 **CATEGORIES**`);
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`${cat.padEnd(12)}: ${count} stories`);
      });
    
    console.log(`\n📡 **SOURCES**`);
    Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .forEach(([source, count]) => {
        console.log(`${source.padEnd(15)}: ${count} stories`);
      });
    
    console.log(`\n🔥 **TOP STORIES** (Score 15+)`);
    const topStories = parsed.stories
      .filter(s => s.score >= 15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    if (topStories.length > 0) {
      topStories.forEach((story, i) => {
        console.log(`${i + 1}. [${story.score}] ${story.title}`);
        console.log(`   ${story.source} • ${story.category} • ${new Date(story.timestamp).toLocaleString()}\n`);
      });
    } else {
      console.log("No high-priority stories found.\n");
    }
    
    console.log(`📊 **RECENT ACTIVITY** (Last 24h)`);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentStories = parsed.stories.filter(s => new Date(s.timestamp) > yesterday);
    console.log(`Stories in last 24h: ${recentStories.length}`);
    
    if (recentStories.length > 0) {
      const recentByHour = {};
      recentStories.forEach(story => {
        const hour = new Date(story.timestamp).getHours();
        recentByHour[hour] = (recentByHour[hour] || 0) + 1;
      });
      
      console.log(`Most active hour: ${Object.entries(recentByHour).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}:00`);
    }
    
    console.log(`\n⚙️  **CONFIGURATION**`);
    console.log(`Monitoring Frequency: Every 5 minutes (GitHub Actions)`);
    console.log(`Minimum Score Threshold: 6`);
    console.log(`GitHub Issue Threshold: 15`);
    console.log(`Discord Notifications: ${process.env.DISCORD_WEBHOOK_URL ? 'Enabled' : 'Disabled'}`);
    
    console.log(`\n🎯 **QUICK STATS**`);
    console.log(`High Priority Stories (15+): ${highPriority}`);
    console.log(`Breaking News (20+): ${parsed.stories.filter(s => s.score >= 20).length}`);
    console.log(`Issues Created: ${parsed.stories.filter(s => s.issueCreated).length}`);
    
  } catch (error) {
    console.log("❌ No monitoring data found. Run 'npm run monitor:test' to generate sample data.");
    console.log(`Error: ${error.message}`);
  }
  
  console.log("\n=====================================");
  console.log("🔗 **QUICK COMMANDS**");
  console.log("npm run monitor:test  - Test with mock data");
  console.log("npm run monitor       - Run real monitoring");
  console.log("npm run issues        - Create GitHub issues");
  console.log("npm run build         - Build main site");
}

generateDashboard().catch(console.error);
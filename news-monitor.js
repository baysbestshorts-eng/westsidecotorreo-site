// Main News Monitor - AI Story Rewriter Integration

import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { CONFIG, validateConfig } from './lib/config.js';
import { newsMonitor } from './lib/news-monitor.js';
import { aiRewriter } from './lib/ai-rewriter.js';
import { flikiFormatter } from './lib/fliki-formatter.js';
import { discordNotifier } from './lib/discord-notifier.js';

class NewsRewriterBot {
  constructor() {
    this.isRunning = false;
    this.processedStories = new Set();
    this.stats = {
      storiesProcessed: 0,
      storiesRewritten: 0,
      errorCount: 0,
      startTime: new Date(),
      lastRun: null
    };
    this.dataDir = './data';
    this.rewrittenStoriesFile = path.join(this.dataDir, 'rewritten-stories.json');
  }

  async initialize() {
    try {
      console.log('🚀 Initializing WSC AI Story Rewriter Bot...');
      
      // Validate configuration
      validateConfig();
      console.log('✅ Configuration validated');
      
      // Initialize AI rewriter
      await aiRewriter.initialize();
      
      // Create data directory
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load previously processed stories
      await this.loadProcessedStories();
      
      console.log('✅ WSC AI Story Rewriter Bot initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      await discordNotifier.sendErrorAlert(error, 'Bot initialization');
      throw error;
    }
  }

  async loadProcessedStories() {
    try {
      const data = await fs.readFile(this.rewrittenStoriesFile, 'utf8');
      const stories = JSON.parse(data);
      this.processedStories = new Set(stories.map(s => s.id));
      console.log(`📚 Loaded ${this.processedStories.size} previously processed stories`);
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
      console.log('📚 Starting with empty processed stories list');
    }
  }

  async saveRewrittenStory(storyData) {
    try {
      let existingStories = [];
      try {
        const data = await fs.readFile(this.rewrittenStoriesFile, 'utf8');
        existingStories = JSON.parse(data);
      } catch {
        // File doesn't exist - start fresh
      }
      
      existingStories.push(storyData);
      
      // Keep only last 1000 stories to prevent file from growing too large
      if (existingStories.length > 1000) {
        existingStories = existingStories.slice(-1000);
      }
      
      await fs.writeFile(this.rewrittenStoriesFile, JSON.stringify(existingStories, null, 2));
    } catch (error) {
      console.error('❌ Failed to save rewritten story:', error.message);
    }
  }

  async processBreakingNews() {
    if (this.isRunning) {
      console.log('⏳ Processing already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.stats.lastRun = new Date();
    
    try {
      console.log('🔍 Starting breaking news scan...');
      
      // Scan news sources
      await newsMonitor.scanAllSources();
      
      // Get new breaking news
      const breaking = newsMonitor.getBreakingNews();
      const newStories = breaking.filter(story => !this.processedStories.has(story.id));
      
      if (newStories.length === 0) {
        console.log('📰 No new breaking news found');
        return;
      }
      
      console.log(`🚨 Processing ${newStories.length} new breaking stories...`);
      
      // Process each new story
      for (const story of newStories.slice(0, CONFIG.maxStoriesPerHour)) {
        try {
          await this.processStory(story);
          this.processedStories.add(story.id);
          this.stats.storiesProcessed++;
          
          // Add delay between stories to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Failed to process story ${story.id}:`, error.message);
          this.stats.errorCount++;
          await discordNotifier.sendErrorAlert(error, `Processing story: ${story.title.slice(0, 50)}`);
        }
      }
      
      // Clean up old stories
      newsMonitor.clearOldStories(24);
      
      console.log('✅ Breaking news processing complete');
      
    } catch (error) {
      console.error('❌ Breaking news processing failed:', error.message);
      this.stats.errorCount++;
      await discordNotifier.sendErrorAlert(error, 'Breaking news processing');
    } finally {
      this.isRunning = false;
    }
  }

  async processStory(story) {
    console.log(`📝 Processing: ${story.title.slice(0, 50)}...`);
    
    try {
      // Send processing update to Discord
      await discordNotifier.sendProcessingUpdate(
        story.title,
        'Starting AI rewrite...',
        `Source: ${story.source}`
      );
      
      // Generate story content for rewriting
      const fullContent = `${story.title}\n\n${story.content}`;
      
      // Generate multiple rewritten versions
      const rewrittenVersions = await aiRewriter.generateMultipleVersions(fullContent, {
        styles: ['breaking', 'analysis', 'recap'],
        language: story.language === 'es' ? 'Spanish' : 'English'
      });
      
      if (rewrittenVersions.versions.length === 0) {
        throw new Error('No rewritten versions generated');
      }
      
      console.log(`✅ Generated ${rewrittenVersions.versions.length} rewritten versions`);
      this.stats.storiesRewritten++;
      
      // Validate fact accuracy for best version
      const factCheck = await aiRewriter.validateFactAccuracy(fullContent, rewrittenVersions.bestVersion.rewritten);
      
      if (!factCheck.isAccurate) {
        console.warn(`⚠️ Fact validation warning: ${factCheck.analysis}`);
      }
      
      // Generate Fliki-ready content from best version
      const flikiContent = flikiFormatter.formatForFliki({
        ...rewrittenVersions.bestVersion,
        title: story.title,
        keyFacts: story.keyFacts
      }, {
        videoLength: 'medium',
        language: story.language === 'es' ? 'Spanish' : 'English'
      });
      
      console.log(`🎬 Generated Fliki-ready content: "${flikiContent.title}"`);
      
      // Send comprehensive Discord notification
      await discordNotifier.sendBreakingNewsAlert(story, rewrittenVersions, flikiContent);
      
      // Send separate Fliki-ready content for easy copy-paste
      await discordNotifier.sendFlikiReadyContent(flikiContent);
      
      // Save processed story data
      const storyData = {
        id: story.id,
        originalStory: story,
        rewrittenVersions: rewrittenVersions,
        flikiContent: flikiContent,
        factCheck: factCheck,
        processedAt: new Date().toISOString()
      };
      
      await this.saveRewrittenStory(storyData);
      
      console.log(`✅ Story processing complete: ${story.title.slice(0, 50)}...`);
      
    } catch (error) {
      console.error(`❌ Story processing failed: ${error.message}`);
      throw error;
    }
  }

  async sendDailyReport() {
    try {
      const monitorStats = newsMonitor.getStats();
      const botStats = {
        ...this.stats,
        uptime: new Date() - this.stats.startTime,
        processedStoriesCount: this.processedStories.size
      };
      
      await discordNotifier.sendDailyStats({
        ...monitorStats,
        ...botStats
      });
      
      console.log('📊 Daily report sent to Discord');
    } catch (error) {
      console.error('❌ Daily report failed:', error.message);
    }
  }

  startScheduledMonitoring() {
    console.log(`⏰ Starting scheduled monitoring (every ${CONFIG.checkIntervalMinutes} minutes)`);
    
    // Monitor for breaking news every X minutes
    const checkInterval = `*/${CONFIG.checkIntervalMinutes} * * * *`;
    cron.schedule(checkInterval, () => {
      this.processBreakingNews().catch(error => {
        console.error('❌ Scheduled processing failed:', error.message);
      });
    });
    
    // Send daily stats report at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.sendDailyReport().catch(error => {
        console.error('❌ Daily report failed:', error.message);
      });
    });
    
    console.log('✅ Scheduled monitoring started');
  }

  async runOnce() {
    console.log('🔄 Running one-time breaking news check...');
    await this.processBreakingNews();
  }

  getStats() {
    return {
      ...this.stats,
      uptime: new Date() - this.stats.startTime,
      processedStoriesCount: this.processedStories.size,
      isRunning: this.isRunning,
      newsMonitorStats: newsMonitor.getStats()
    };
  }
}

// Main execution
async function main() {
  const bot = new NewsRewriterBot();
  
  try {
    await bot.initialize();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--once')) {
      // Run once and exit
      await bot.runOnce();
      console.log('✅ One-time run complete');
      process.exit(0);
    } else if (args.includes('--stats')) {
      // Show stats and exit
      console.log('📊 Current Stats:', JSON.stringify(bot.getStats(), null, 2));
      process.exit(0);
    } else {
      // Start continuous monitoring
      await bot.runOnce(); // Run immediately first
      bot.startScheduledMonitoring();
      
      console.log('🤖 WSC AI Story Rewriter Bot is now running...');
      console.log('Press Ctrl+C to stop');
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down WSC AI Story Rewriter Bot...');
        process.exit(0);
      });
    }
    
  } catch (error) {
    console.error('❌ Bot failed to start:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { NewsRewriterBot };
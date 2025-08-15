// News Monitoring System - Breaking Sports News Detection

import Parser from 'rss-parser';
import { CONFIG, clean } from './config.js';

// Sports news sources configuration
export const NEWS_SOURCES = [
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    category: 'general',
    language: 'en'
  },
  {
    name: 'ESPN Deportes',
    url: 'https://www.espndeportes.com/espn/rss/news', 
    category: 'general',
    language: 'es'
  },
  {
    name: 'ESPN NFL',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    category: 'nfl',
    language: 'en'
  },
  {
    name: 'ESPN NBA',
    url: 'https://www.espn.com/espn/rss/nba/news',
    category: 'nba', 
    language: 'en'
  },
  {
    name: 'ESPN MLB',
    url: 'https://www.espn.com/espn/rss/mlb/news',
    category: 'mlb',
    language: 'en'
  },
  {
    name: 'ESPN Soccer',
    url: 'https://www.espn.com/espn/rss/soccer/news',
    category: 'soccer',
    language: 'en'
  },
  // Backup sources
  {
    name: 'Yahoo Sports',
    url: 'https://sports.yahoo.com/rss/',
    category: 'general',
    language: 'en'
  },
  {
    name: 'CBS Sports',
    url: 'https://www.cbssports.com/rss/headlines/',
    category: 'general',
    language: 'en'
  }
];

export class NewsMonitor {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'WSC-NewsBot/1.0 (Sports News Aggregator)'
      }
    });
    this.seenStories = new Set();
    this.breakingNews = [];
    this.lastCheck = new Date();
  }

  isBreakingNews(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    
    // Check for breaking news keywords
    const breakingKeywords = CONFIG.monitorKeywords.map(k => k.toLowerCase());
    const hasBreakingKeyword = breakingKeywords.some(keyword => text.includes(keyword));
    
    // Additional breaking news indicators
    const urgentIndicators = [
      'breaking:',
      'just in:',
      'urgent:',
      'report:',
      'confirmed:',
      'official:',
      'developing:',
      'alert:',
      'update:'
    ];
    
    const hasUrgentIndicator = urgentIndicators.some(indicator => text.includes(indicator));
    
    // Time-sensitive keywords
    const timeSensitive = [
      'just signed',
      'just announced',
      'just traded',
      'just released',
      'just fired',
      'just hired',
      'just suspended',
      'just activated',
      'just placed on',
      'minutes ago',
      'just now'
    ];
    
    const isTimeSensitive = timeSensitive.some(phrase => text.includes(phrase));
    
    return hasBreakingKeyword || hasUrgentIndicator || isTimeSensitive;
  }

  extractKeyFacts(story) {
    const { title, content, link } = story;
    const text = `${title} ${content}`;
    
    // Extract potential names (capitalized words, likely proper nouns)
    const nameMatches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const potentialNames = nameMatches.filter(name => 
      name.length > 2 && 
      !['The', 'This', 'That', 'ESPN', 'NFL', 'NBA', 'MLB'].includes(name)
    );
    
    // Extract numbers and statistics
    const numbers = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\b/g) || [];
    
    // Extract dates
    const dates = text.match(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}|\b\d{1,2}\/\d{1,2}\/\d{4}|\b\d{4}-\d{2}-\d{2}\b/gi) || [];
    
    // Extract quotes (simple approximation)
    const quotes = text.match(/"[^"]+"/g) || [];
    
    return {
      names: [...new Set(potentialNames)].slice(0, 10),
      numbers: [...new Set(numbers)].slice(0, 10),
      dates: [...new Set(dates)].slice(0, 5),
      quotes: [...new Set(quotes)].slice(0, 5),
      wordCount: text.split(/\s+/).length
    };
  }

  async fetchNewsFromSource(source) {
    try {
      console.log(`📡 Fetching news from ${source.name}...`);
      
      const feed = await this.parser.parseURL(source.url);
      const stories = [];
      
      for (const item of feed.items) {
        const storyId = `${source.name}-${item.guid || item.link}`;
        
        // Skip if we've already processed this story
        if (this.seenStories.has(storyId)) {
          continue;
        }
        
        const story = {
          id: storyId,
          source: source.name,
          category: source.category,
          language: source.language,
          title: clean(item.title || ''),
          content: clean(item.contentSnippet || item.summary || ''),
          link: item.link,
          publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          guid: item.guid
        };
        
        // Check if this is breaking news
        if (this.isBreakingNews(story.title, story.content)) {
          story.isBreaking = true;
          story.keyFacts = this.extractKeyFacts(story);
          
          console.log(`🚨 Breaking news detected: ${story.title.slice(0, 60)}...`);
          this.breakingNews.push(story);
        }
        
        stories.push(story);
        this.seenStories.add(storyId);
      }
      
      console.log(`✅ ${source.name}: ${stories.length} new stories (${stories.filter(s => s.isBreaking).length} breaking)`);
      return stories;
      
    } catch (error) {
      console.error(`❌ Failed to fetch from ${source.name}:`, error.message);
      return [];
    }
  }

  async scanAllSources() {
    console.log(`🔍 Scanning ${NEWS_SOURCES.length} news sources for breaking stories...`);
    
    const allStories = [];
    const fetchPromises = NEWS_SOURCES.map(source => 
      this.fetchNewsFromSource(source).catch(error => {
        console.error(`Source ${source.name} failed:`, error.message);
        return [];
      })
    );
    
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allStories.push(...result.value);
      } else {
        console.error(`❌ Source ${NEWS_SOURCES[index].name} failed:`, result.reason.message);
      }
    });
    
    const breakingCount = allStories.filter(s => s.isBreaking).length;
    console.log(`📊 Scan complete: ${allStories.length} total stories, ${breakingCount} breaking news`);
    
    this.lastCheck = new Date();
    return allStories;
  }

  getBreakingNews(sinceDate = null) {
    let breaking = this.breakingNews;
    
    if (sinceDate) {
      breaking = breaking.filter(story => story.publishDate > sinceDate);
    }
    
    // Sort by publish date, newest first
    return breaking.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  }

  clearOldStories(hoursBack = 24) {
    const cutoff = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    
    // Remove old breaking news
    const oldCount = this.breakingNews.length;
    this.breakingNews = this.breakingNews.filter(story => story.publishDate > cutoff);
    
    // Clear old seen stories to prevent memory bloat
    // Note: This is simplified - in production you'd want a more sophisticated cache
    if (this.seenStories.size > 10000) {
      console.log('🧹 Clearing old seen stories cache...');
      this.seenStories.clear();
    }
    
    const removedCount = oldCount - this.breakingNews.length;
    if (removedCount > 0) {
      console.log(`🧹 Removed ${removedCount} old breaking news stories`);
    }
  }

  getStats() {
    return {
      totalBreakingNews: this.breakingNews.length,
      seenStories: this.seenStories.size,
      lastCheck: this.lastCheck,
      sourceCount: NEWS_SOURCES.length,
      breakingBySource: this.breakingNews.reduce((acc, story) => {
        acc[story.source] = (acc[story.source] || 0) + 1;
        return acc;
      }, {}),
      breakingByCategory: this.breakingNews.reduce((acc, story) => {
        acc[story.category] = (acc[story.category] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Export singleton instance
export const newsMonitor = new NewsMonitor();
// breaking-news-bot.js - 24/7 Breaking Sports News Email Bot
// Monitors sports news, rewrites with AI, and sends email alerts to basybestshorts@gmail.com

import nodemailer from 'nodemailer';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
  email: {
    to: 'basybestshorts@gmail.com',
    from: process.env.EMAIL_USERNAME || '',
    smtp: {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    }
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  monitoring: {
    checkInterval: 5 * 60 * 1000, // 5 minutes
    quietHoursStart: 23, // 11 PM UTC
    quietHoursEnd: 6,    // 6 AM UTC
    urgencyThresholds: {
      breaking: 8.0,    // Immediate email
      trending: 6.0,    // Hourly digest
      watching: 4.0     // Daily summary
    }
  }
};

// Sports news sources - RSS feeds and APIs
const NEWS_SOURCES = [
  {
    name: 'ESPN NFL',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    category: 'NFL',
    priority: 1
  },
  {
    name: 'ESPN NBA',
    url: 'https://www.espn.com/espn/rss/nba/news',
    category: 'NBA',
    priority: 1
  },
  {
    name: 'ESPN MLB',
    url: 'https://www.espn.com/espn/rss/mlb/news',
    category: 'MLB',
    priority: 1
  },
  {
    name: 'CBS Sports',
    url: 'https://www.cbssports.com/rss/headlines',
    category: 'General',
    priority: 2
  },
  {
    name: 'Yahoo Sports',
    url: 'https://sports.yahoo.com/rss/',
    category: 'General',
    priority: 2
  }
];

// Initialize services
const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });
const emailTransporter = nodemailer.createTransporter(CONFIG.email.smtp);

// Story storage for deduplication
let processedStories = new Set();
let dailyDigest = [];
let hourlyDigest = [];

// Main monitoring function
async function monitorBreakingNews() {
  console.log(`🔍 Starting news monitoring at ${new Date().toISOString()}`);
  
  try {
    const allStories = await fetchAllNewsStories();
    const newStories = filterNewStories(allStories);
    
    console.log(`📰 Found ${newStories.length} new stories to process`);
    
    for (const story of newStories) {
      const processedStory = await processStory(story);
      await handleStoryByUrgency(processedStory);
    }
    
  } catch (error) {
    console.error('❌ Error in news monitoring:', error);
    await sendErrorNotification(error);
  }
}

// Fetch news from all sources
async function fetchAllNewsStories() {
  const allStories = [];
  
  for (const source of NEWS_SOURCES) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      const stories = await fetchRSSFeed(source);
      allStories.push(...stories);
    } catch (error) {
      console.error(`⚠️ Failed to fetch from ${source.name}:`, error.message);
    }
  }
  
  return allStories;
}

// Fetch and parse RSS feed
async function fetchRSSFeed(source) {
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; WSC-NewsBot/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml'
    },
    timeout: 10000 // 10 second timeout
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  if (!xmlText || xmlText.length < 100) {
    throw new Error('Invalid or empty RSS response');
  }
  
  return parseRSSStories(xmlText, source);
}

// Simple RSS parser
function parseRSSStories(xmlText, source) {
  const stories = [];
  const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];
  
  for (const item of items) {
    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link');
    const description = extractTag(item, 'description');
    const pubDate = extractTag(item, 'pubDate');
    
    if (title && link) {
      stories.push({
        title: cleanText(title),
        link: link.trim(),
        description: cleanText(description),
        publishedAt: new Date(pubDate || Date.now()),
        source: source.name,
        category: source.category,
        priority: source.priority,
        id: generateStoryId(title, link)
      });
    }
  }
  
  return stories;
}

// Extract XML tag content
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

// Clean and decode text
function cleanText(text) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate unique story ID
function generateStoryId(title, link) {
  return Buffer.from(title + link).toString('base64').substring(0, 16);
}

// Filter out already processed stories
function filterNewStories(stories) {
  return stories.filter(story => {
    if (processedStories.has(story.id)) {
      return false;
    }
    processedStories.add(story.id);
    return true;
  });
}

// Process story with AI rewriting and urgency scoring
async function processStory(story) {
  console.log(`🤖 Processing: ${story.title}`);
  
  const urgencyScore = calculateUrgencyScore(story);
  const category = categorizeStory(story);
  const rewrittenVersions = await rewriteStoryWithAI(story);
  
  return {
    ...story,
    urgencyScore,
    category,
    rewrittenVersions,
    processedAt: new Date()
  };
}

// Calculate urgency score (0-10)
function calculateUrgencyScore(story) {
  let score = 0;
  const text = (story.title + ' ' + story.description).toLowerCase();
  
  // Breaking news indicators
  if (text.includes('breaking') || text.includes('urgent')) score += 3;
  if (text.includes('trade') || text.includes('traded')) score += 2.5;
  if (text.includes('injured') || text.includes('injury')) score += 2.5;
  if (text.includes('scandal') || text.includes('arrest')) score += 3;
  if (text.includes('record') || text.includes('milestone')) score += 2;
  if (text.includes('fired') || text.includes('hired')) score += 2;
  if (text.includes('retire') || text.includes('retirement')) score += 2.5;
  
  // High-profile players/teams (add more as needed)
  const highProfileTerms = [
    'mahomes', 'brady', 'lebron', 'curry', 'chiefs', 'patriots', 
    'lakers', 'cowboys', 'yankees', 'dodgers'
  ];
  
  for (const term of highProfileTerms) {
    if (text.includes(term)) {
      score += 1.5;
      break;
    }
  }
  
  // Time sensitivity
  const hoursOld = (Date.now() - story.publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursOld < 1) score += 1;
  else if (hoursOld > 24) score -= 2;
  
  // Source priority
  score += (3 - story.priority);
  
  return Math.min(Math.max(score, 0), 10);
}

// Categorize story type
function categorizeStory(story) {
  const text = (story.title + ' ' + story.description).toLowerCase();
  
  if (text.includes('trade') || text.includes('traded')) return 'Trade';
  if (text.includes('injur')) return 'Injury';
  if (text.includes('scandal') || text.includes('arrest')) return 'Scandal';
  if (text.includes('record') || text.includes('milestone')) return 'Record';
  if (text.includes('fired') || text.includes('hired')) return 'Personnel';
  if (text.includes('retire')) return 'Retirement';
  if (text.includes('game') || text.includes('score')) return 'Game Result';
  
  return 'General';
}

// Rewrite story with OpenAI (3 versions)
async function rewriteStoryWithAI(story) {
  const prompt = `Rewrite this sports news story in 3 different styles, maintaining all facts but changing the wording completely to avoid copyright issues:

Original: ${story.title}
Description: ${story.description}

Create 3 versions:
1. Breaking News Style (40-50 words, urgent tone)
2. Analysis Style (50-60 words, explanatory tone) 
3. Quick Update Style (30-40 words, casual tone)

Each version should be completely original wording while preserving all facts.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sports news rewriter. Create engaging, original content that maintains factual accuracy while completely changing the wording to avoid copyright issues.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    return parseAIResponse(content);
    
  } catch (error) {
    console.error('❌ OpenAI rewriting failed:', error);
    return generateFallbackVersions(story);
  }
}

// Parse AI response into structured versions
function parseAIResponse(content) {
  const versions = {
    breaking: '',
    analysis: '',
    quick: ''
  };
  
  const lines = content.split('\n').filter(line => line.trim());
  let currentVersion = '';
  
  for (const line of lines) {
    if (line.includes('Breaking News') || line.includes('1.')) {
      currentVersion = 'breaking';
    } else if (line.includes('Analysis') || line.includes('2.')) {
      currentVersion = 'analysis';
    } else if (line.includes('Quick Update') || line.includes('3.')) {
      currentVersion = 'quick';
    } else if (currentVersion && line.trim() && !line.includes(':')) {
      versions[currentVersion] = line.trim();
    }
  }
  
  return versions;
}

// Fallback versions if AI fails
function generateFallbackVersions(story) {
  return {
    breaking: `BREAKING: ${story.title}`,
    analysis: `Sports Update: ${story.title}. ${story.description.substring(0, 100)}...`,
    quick: `Quick update: ${story.title}`
  };
}

// Handle story based on urgency level
async function handleStoryByUrgency(story) {
  const { urgencyScore } = story;
  
  if (urgencyScore >= CONFIG.monitoring.urgencyThresholds.breaking) {
    // Breaking news - send immediately (unless in quiet hours)
    if (!isQuietHours() || urgencyScore >= 9.0) {
      await sendBreakingNewsEmail(story);
    } else {
      hourlyDigest.push(story);
    }
  } else if (urgencyScore >= CONFIG.monitoring.urgencyThresholds.trending) {
    // Trending - add to hourly digest
    hourlyDigest.push(story);
  } else if (urgencyScore >= CONFIG.monitoring.urgencyThresholds.watching) {
    // Worth watching - add to daily digest
    dailyDigest.push(story);
  }
}

// Check if currently in quiet hours
function isQuietHours() {
  const hour = new Date().getUTCHours();
  return hour >= CONFIG.monitoring.quietHoursStart || hour < CONFIG.monitoring.quietHoursEnd;
}

// Send breaking news email immediately
async function sendBreakingNewsEmail(story) {
  const subject = `🚨 BREAKING: ${story.title.substring(0, 50)}... | ${story.category} | Urgency: ${story.urgencyScore.toFixed(1)}/10`;
  const html = generateBreakingNewsHTML(story);
  
  await sendEmail(subject, html, 'breaking');
  console.log(`📧 Sent breaking news email for: ${story.title}`);
}

// Generate breaking news email HTML
function generateBreakingNewsHTML(story) {
  const actionRecommendation = story.urgencyScore >= 8.5 
    ? "High-value story - create video immediately via Make.com"
    : "Consider creating video content for this trending story";
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Breaking Sports News Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d32f2f; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f9f9f9; border: 1px solid #ddd; border-top: none; padding: 20px; }
        .story-header { background: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .story-header p { margin: 5px 0; }
        .version { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #1976d2; border-radius: 5px; }
        .version h3 { margin: 0 0 10px 0; color: #1976d2; }
        .action { background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .urgency-high { color: #d32f2f; font-weight: bold; }
        .urgency-medium { color: #f57c00; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Breaking Sports News Alert</h1>
    </div>
    
    <div class="content">
        <div class="story-header">
            <p><strong>Detected:</strong> ${story.processedAt.toISOString()}</p>
            <p><strong>Urgency Score:</strong> <span class="urgency-high">${story.urgencyScore.toFixed(1)}/10</span></p>
            <p><strong>Category:</strong> ${story.category}</p>
            <p><strong>Source:</strong> ${story.source}</p>
            <p><strong>Original Link:</strong> <a href="${story.link}" target="_blank">View Source</a></p>
        </div>
        
        <div class="version">
            <h3>VERSION 1 - Breaking News Style:</h3>
            <p>"${story.rewrittenVersions.breaking}"</p>
            <small>Word count: ${story.rewrittenVersions.breaking.split(' ').length} words</small>
        </div>
        
        <div class="version">
            <h3>VERSION 2 - Analysis Style:</h3>
            <p>"${story.rewrittenVersions.analysis}"</p>
            <small>Word count: ${story.rewrittenVersions.analysis.split(' ').length} words</small>
        </div>
        
        <div class="version">
            <h3>VERSION 3 - Quick Update Style:</h3>
            <p>"${story.rewrittenVersions.quick}"</p>
            <small>Word count: ${story.rewrittenVersions.quick.split(' ').length} words</small>
        </div>
        
        <div class="action">
            <h3>📹 Action Required:</h3>
            <p>${actionRecommendation}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>West Side Cotorreo Breaking News Bot</p>
        <p>This email was sent to ${CONFIG.email.to}</p>
    </div>
</body>
</html>`;
}

// Send email helper
async function sendEmail(subject, html, type = 'general') {
  try {
    const mailOptions = {
      from: `"WSC News Bot" <${CONFIG.email.from}>`,
      to: CONFIG.email.to,
      subject: subject,
      html: html
    };
    
    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully (${type}):`, result.messageId);
    return result;
    
  } catch (error) {
    console.error(`❌ Failed to send email (${type}):`, error);
    throw error;
  }
}

// Send error notification
async function sendErrorNotification(error) {
  const subject = '⚠️ WSC News Bot Error Alert';
  const html = `
    <h2>Breaking News Bot Error</h2>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>Error:</strong> ${error.message}</p>
    <p><strong>Stack:</strong></p>
    <pre>${error.stack}</pre>
  `;
  
  try {
    await sendEmail(subject, html, 'error');
  } catch (emailError) {
    console.error('❌ Failed to send error notification:', emailError);
  }
}

// Send hourly digest
async function sendHourlyDigest() {
  if (hourlyDigest.length === 0) return;
  
  const subject = `📰 Hourly Sports Digest - ${hourlyDigest.length} Trending Stories`;
  const html = generateDigestHTML(hourlyDigest, 'Hourly Trending Sports Stories');
  
  await sendEmail(subject, html, 'hourly');
  console.log(`📧 Sent hourly digest with ${hourlyDigest.length} stories`);
  
  // Clear digest
  hourlyDigest = [];
}

// Send daily digest
async function sendDailyDigest() {
  if (dailyDigest.length === 0) return;
  
  const subject = `📅 Daily Sports Summary - ${dailyDigest.length} Stories Worth Watching`;
  const html = generateDigestHTML(dailyDigest, 'Daily Sports Summary');
  
  await sendEmail(subject, html, 'daily');
  console.log(`📧 Sent daily digest with ${dailyDigest.length} stories`);
  
  // Clear digest
  dailyDigest = [];
}

// Generate digest email HTML
function generateDigestHTML(stories, title) {
  const storiesHtml = stories.map(story => `
    <div style="border: 1px solid #ddd; margin: 15px 0; padding: 15px; border-radius: 5px;">
      <h3 style="margin: 0 0 10px 0; color: #1976d2;">${story.title}</h3>
      <p><strong>Urgency:</strong> ${story.urgencyScore.toFixed(1)}/10 | <strong>Category:</strong> ${story.category}</p>
      <p><strong>Source:</strong> ${story.source} | <a href="${story.link}" target="_blank">View Original</a></p>
      <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 3px;">
        <strong>Quick Version:</strong> "${story.rewrittenVersions.quick}"
      </div>
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1976d2; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Delivered to ${CONFIG.email.to}</p>
    </div>
    <div style="padding: 20px 0;">
        ${storiesHtml}
    </div>
    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>West Side Cotorreo News Bot - ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
}

// Schedule digest emails
function scheduleDigests() {
  // Hourly digest (at :00 minutes)
  setInterval(() => {
    const now = new Date();
    if (now.getMinutes() === 0 && !isQuietHours()) {
      sendHourlyDigest();
    }
  }, 60 * 1000); // Check every minute
  
  // Daily digest (at 8 AM UTC)
  setInterval(() => {
    const now = new Date();
    if (now.getUTCHours() === 8 && now.getMinutes() === 0) {
      sendDailyDigest();
    }
  }, 60 * 1000); // Check every minute
}

// Test email configuration
async function testEmailConfiguration() {
  console.log('🧪 Testing email configuration...');
  
  try {
    await emailTransporter.verify();
    console.log('✅ Email configuration is valid');
    
    // Send test email
    const testSubject = '🧪 WSC News Bot Test Email';
    const testHtml = `
      <h2>Email Configuration Test</h2>
      <p>This is a test email from the WSC Breaking News Bot.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p>If you receive this, the email configuration is working correctly!</p>
    `;
    
    await sendEmail(testSubject, testHtml, 'test');
    console.log('✅ Test email sent successfully');
    
  } catch (error) {
    console.error('❌ Email configuration test failed:', error);
    throw error;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting WSC Breaking Sports News Bot...');
  
  // Validate configuration
  if (!CONFIG.email.smtp.auth.user || !CONFIG.email.smtp.auth.pass) {
    throw new Error('Email configuration missing: EMAIL_USERNAME and EMAIL_PASSWORD required');
  }
  
  if (!CONFIG.openai.apiKey) {
    throw new Error('OpenAI configuration missing: OPENAI_API_KEY required');
  }
  
  // Test email configuration
  await testEmailConfiguration();
  
  // Schedule digest emails
  scheduleDigests();
  
  // Start monitoring loop
  console.log(`🔄 Starting monitoring loop (checking every ${CONFIG.monitoring.checkInterval / 1000} seconds)`);
  
  // Initial run
  await monitorBreakingNews();
  
  // Set up recurring monitoring
  setInterval(monitorBreakingNews, CONFIG.monitoring.checkInterval);
  
  console.log('✅ Breaking News Bot is now running 24/7');
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { main, monitorBreakingNews, testEmailConfiguration };
// demo-news-bot.js - Demo mode of the breaking news bot with mock data
// This demonstrates the full email workflow without requiring external APIs

import fs from 'fs/promises';

// Mock configuration for demo
const DEMO_CONFIG = {
  email: {
    to: 'basybestshorts@gmail.com',
    from: 'demo@example.com'
  },
  monitoring: {
    urgencyThresholds: {
      breaking: 8.0,
      trending: 6.0,
      watching: 4.0
    }
  }
};

// Mock news stories for demonstration
const MOCK_STORIES = [
  {
    title: 'BREAKING: Patrick Mahomes suffers ankle injury at Chiefs practice',
    description: 'The star quarterback was injured during Wednesday practice but is expected to play Sunday against the Broncos. Coach Andy Reid downplayed the severity.',
    publishedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    source: 'ESPN NFL',
    category: 'NFL',
    priority: 1,
    link: 'https://example.com/mahomes-injury',
    id: 'story_001'
  },
  {
    title: 'LeBron James considering retirement after Lakers playoff exit',
    description: 'The 39-year-old superstar hinted at possible retirement following the Lakers early playoff elimination. Decision expected this summer.',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    source: 'ESPN NBA',
    category: 'NBA',
    priority: 1,
    link: 'https://example.com/lebron-retirement',
    id: 'story_002'
  },
  {
    title: 'Yankees acquire star pitcher in blockbuster trade',
    description: 'New York has traded three prospects to acquire the All-Star pitcher from the Rangers in a deal that strengthens their rotation.',
    publishedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    source: 'CBS Sports',
    category: 'MLB',
    priority: 1,
    link: 'https://example.com/yankees-trade',
    id: 'story_003'
  },
  {
    title: 'Cowboys release veteran linebacker in salary cap move',
    description: 'Dallas has released the 8-year veteran to create cap space for other signings. The player is expected to draw interest from contenders.',
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    source: 'Yahoo Sports',
    category: 'NFL',
    priority: 2,
    link: 'https://example.com/cowboys-release',
    id: 'story_004'
  }
];

// Mock AI rewriting (simulates OpenAI responses)
function mockAIRewrite(story) {
  const templates = {
    breaking: [
      `Breaking news from {team} - {player} {event}. But here's the good news: {positive_spin}. This is exactly what {fanbase} needed to hear.`,
      `URGENT UPDATE: {player} {event} at {location} today. Coach says {coach_quote}, and {player} should be ready for {next_game}.`,
      `BREAKING: {headline_summary}. The good news? {optimistic_take}. {team} fans can breathe easy knowing {reassurance}.`
    ],
    analysis: [
      `Let's talk about what just happened with {player}. {event_description}, but before you panic - {reassurance}. This is huge for {impact_group}.`,
      `Here's the situation with {player}: {event_summary}. While this looks concerning, {positive_angle}. For {fanbase}, this means {implication}.`,
      `Breaking down the {player} situation - {event_details}. The reality is {balanced_take}, which should {fan_reaction} for {team} supporters.`
    ],
    quick: [
      `Quick update on {player} - {brief_event} but {quick_resolution}. {simple_conclusion}.`,
      `{player} news: {short_summary}. {outcome} - {fan_sentiment}!`,
      `Update: {event_summary} but {positive_spin}. {team} fans can {reaction}.`
    ]
  };

  // Simple template replacement logic
  function fillTemplate(template, story) {
    const replacements = {
      '{team}': extractTeam(story.title),
      '{player}': extractPlayer(story.title),
      '{event}': extractEvent(story.title),
      '{positive_spin}': 'everything looks good',
      '{fanbase}': extractTeam(story.title) + ' fans',
      '{coach_quote}': '"it\'s nothing serious"',
      '{next_game}': 'this weekend',
      '{location}': 'practice',
      '{headline_summary}': story.title.split(' ').slice(1, 8).join(' '),
      '{optimistic_take}': 'it\'s not as bad as it sounds',
      '{reassurance}': 'the injury is minor',
      '{impact_group}': 'fantasy owners',
      '{event_description}': story.description.split('.')[0],
      '{implication}': 'they should still perform well',
      '{event_details}': 'the situation is developing',
      '{balanced_take}': 'it\'s manageable',
      '{fan_reaction}': 'be encouraging',
      '{brief_event}': extractEvent(story.title),
      '{quick_resolution}': 'all is well',
      '{simple_conclusion}': 'No need to worry',
      '{short_summary}': story.title.split(' ').slice(0, 5).join(' '),
      '{outcome}': 'everything\'s fine',
      '{fan_sentiment}': 'crisis averted',
      '{event_summary}': extractEvent(story.title),
      '{reaction}': 'relax'
    };

    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    return result;
  }

  // Pick random templates
  const breaking = fillTemplate(
    templates.breaking[Math.floor(Math.random() * templates.breaking.length)], 
    story
  );
  const analysis = fillTemplate(
    templates.analysis[Math.floor(Math.random() * templates.analysis.length)], 
    story
  );
  const quick = fillTemplate(
    templates.quick[Math.floor(Math.random() * templates.quick.length)], 
    story
  );

  return { breaking, analysis, quick };
}

// Helper functions for template replacement
function extractTeam(title) {
  const teams = ['Chiefs', 'Lakers', 'Yankees', 'Cowboys', 'Patriots', 'Warriors'];
  for (const team of teams) {
    if (title.includes(team)) return team;
  }
  return 'the team';
}

function extractPlayer(title) {
  const players = ['Patrick Mahomes', 'LeBron James', 'Mahomes', 'LeBron'];
  for (const player of players) {
    if (title.includes(player)) return player;
  }
  return 'the player';
}

function extractEvent(title) {
  if (title.includes('injury') || title.includes('injured')) return 'picked up an injury';
  if (title.includes('trade') || title.includes('traded')) return 'was traded';
  if (title.includes('retire')) return 'is considering retirement';
  if (title.includes('release')) return 'was released';
  return 'had an update';
}

// Calculate urgency score (same as main bot)
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
  
  // High-profile players/teams
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

// Generate demo email HTML
function generateDemoEmailHTML(story) {
  const actionRecommendation = story.urgencyScore >= 8.5 
    ? "🚨 High-value story - create video immediately via Make.com"
    : story.urgencyScore >= 6.0
    ? "📈 Trending story - consider creating video content" 
    : "📝 Worth watching - add to content pipeline";
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Breaking Sports News Alert - DEMO</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .demo-banner { background: #ff9800; color: white; padding: 10px; text-align: center; font-weight: bold; border-radius: 5px; margin-bottom: 20px; }
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
        .urgency-low { color: #388e3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="demo-banner">
        🧪 DEMO MODE - This is a simulated email from the WSC Breaking News Bot
    </div>
    
    <div class="header">
        <h1>🚨 Breaking Sports News Alert</h1>
    </div>
    
    <div class="content">
        <div class="story-header">
            <p><strong>Detected:</strong> ${story.processedAt.toISOString()}</p>
            <p><strong>Urgency Score:</strong> <span class="${story.urgencyScore >= 8 ? 'urgency-high' : story.urgencyScore >= 6 ? 'urgency-medium' : 'urgency-low'}">${story.urgencyScore.toFixed(1)}/10</span></p>
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
        <p>West Side Cotorreo Breaking News Bot - DEMO MODE</p>
        <p>This email would be sent to ${DEMO_CONFIG.email.to}</p>
        <p>Demo generated at ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
}

// Demo processing of all mock stories
async function runDemo() {
  console.log('🎬 Running WSC Breaking News Bot Demo');
  console.log('=====================================\n');
  
  console.log(`📧 Target Email: ${DEMO_CONFIG.email.to}`);
  console.log(`📊 Processing ${MOCK_STORIES.length} mock stories...\n`);
  
  const processedStories = [];
  
  for (let i = 0; i < MOCK_STORIES.length; i++) {
    const story = MOCK_STORIES[i];
    console.log(`🔄 Processing Story ${i + 1}: "${story.title}"`);
    
    // Calculate urgency and category
    const urgencyScore = calculateUrgencyScore(story);
    const category = categorizeStory(story);
    
    // Mock AI rewriting
    const rewrittenVersions = mockAIRewrite(story);
    
    const processedStory = {
      ...story,
      urgencyScore,
      category,
      rewrittenVersions,
      processedAt: new Date()
    };
    
    processedStories.push(processedStory);
    
    // Determine delivery method
    let deliveryMethod;
    if (urgencyScore >= DEMO_CONFIG.monitoring.urgencyThresholds.breaking) {
      deliveryMethod = '🚨 IMMEDIATE EMAIL';
    } else if (urgencyScore >= DEMO_CONFIG.monitoring.urgencyThresholds.trending) {
      deliveryMethod = '📊 HOURLY DIGEST';
    } else {
      deliveryMethod = '📅 DAILY SUMMARY';
    }
    
    console.log(`   ⚡ Urgency: ${urgencyScore.toFixed(1)}/10`);
    console.log(`   🏷️  Category: ${category}`);
    console.log(`   📬 Delivery: ${deliveryMethod}`);
    console.log(`   📝 Versions: ${Object.keys(rewrittenVersions).length} AI rewrites generated`);
    console.log('');
  }
  
  // Generate demo emails for breaking news stories
  const breakingStories = processedStories.filter(s => s.urgencyScore >= DEMO_CONFIG.monitoring.urgencyThresholds.breaking);
  
  if (breakingStories.length > 0) {
    console.log(`📧 Generating ${breakingStories.length} breaking news demo email(s)...\n`);
    
    for (let i = 0; i < breakingStories.length; i++) {
      const story = breakingStories[i];
      const subject = `🚨 BREAKING: ${story.title.substring(0, 50)}... | ${story.category} | Urgency: ${story.urgencyScore.toFixed(1)}/10`;
      const emailHTML = generateDemoEmailHTML(story);
      
      // Save demo email to file
      const filename = `demo-email-${i + 1}-${story.id}.html`;
      await fs.writeFile(filename, emailHTML);
      
      console.log(`📧 Demo Email ${i + 1}:`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Saved to: ${filename}`);
      console.log(`   Open in browser to see the email preview`);
      console.log('');
    }
  }
  
  // Summary
  console.log('📈 Demo Summary:');
  console.log('================');
  console.log(`📰 Total stories processed: ${processedStories.length}`);
  console.log(`🚨 Breaking news (immediate): ${processedStories.filter(s => s.urgencyScore >= 8.0).length}`);
  console.log(`📊 Trending (hourly): ${processedStories.filter(s => s.urgencyScore >= 6.0 && s.urgencyScore < 8.0).length}`);
  console.log(`📅 Worth watching (daily): ${processedStories.filter(s => s.urgencyScore >= 4.0 && s.urgencyScore < 6.0).length}`);
  console.log(`📧 Demo emails generated: ${breakingStories.length}`);
  
  console.log('\n✅ Demo completed successfully!');
  console.log('\n🔧 Next Steps for Production:');
  console.log('1. Set EMAIL_USERNAME and EMAIL_PASSWORD environment variables');
  console.log('2. Set OPENAI_API_KEY environment variable');
  console.log('3. Deploy to GitHub Actions for 24/7 monitoring');
  console.log('4. Monitor basybestshorts@gmail.com for real breaking news alerts');
}

runDemo().catch(console.error);
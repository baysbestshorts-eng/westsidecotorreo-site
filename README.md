# WSC AI Story Rewriter for Breaking News Bot

This repository now includes an AI-powered story rewriting system that transforms original breaking sports news into unique, copyright-free content ready for Fliki AI video creation.

## 🚀 Features

### 🤖 AI Story Rewriter
- **OpenAI/Claude Integration**: Uses GPT-4 or Claude for intelligent rewriting
- **Multiple Styles**: Breaking news, analysis, recap, opinion, quick update
- **Fact Preservation**: Maintains all key details, names, numbers, dates
- **Originality Scoring**: Ensures 85%+ difference from source material
- **Multiple Versions**: Generates 2-3 unique versions per story for A/B testing

### 📡 News Monitoring
- **24/7 Monitoring**: Scans multiple sports news sources (ESPN, Yahoo Sports, CBS)
- **Breaking News Detection**: AI-powered detection using keywords and urgency indicators
- **Key Fact Extraction**: Automatically identifies names, dates, statistics, quotes
- **Multi-source**: Supports English and Spanish news sources

### 🎬 Fliki AI Integration
- **Script Formatting**: Structures content for video narration
- **Visual Cues**: Suggests images/clips for video segments
- **Timing Markers**: Provides pacing for different video lengths
- **Voice Settings**: Optimized for energetic sports commentary
- **Social Media**: Generates hashtags, Twitter/Instagram captions

### 📢 Discord Integration
- **Enhanced Notifications**: Rich embeds with rewritten content
- **Copy-Paste Ready**: Fliki scripts formatted for immediate use
- **Processing Updates**: Real-time status of story processing
- **Daily Stats**: Monitoring reports and performance metrics
- **Error Alerts**: Automatic error notifications

## 📦 Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd westsidecotorreo-site
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Required API Keys**
   - OpenAI API Key (for GPT-4)
   - Discord Webhook URL (for notifications)
   - Optional: Anthropic API Key (for Claude)

## 🎯 Usage

### Run Tests
```bash
npm test
```

### Start Monitoring (Continuous)
```bash
npm run monitor
```

### One-time Check
```bash
npm run monitor:once
```

### View Statistics
```bash
npm run monitor:stats
```

## 📊 Configuration

### Environment Variables (.env)
```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
AI_PROVIDER=openai
AI_MODEL=gpt-4-turbo-preview

# Discord Integration
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# Processing Settings
MAX_STORIES_PER_HOUR=20
REWRITE_VERSIONS=3
TARGET_ORIGINALITY_SCORE=85
CHECK_INTERVAL_MINUTES=5

# Monitoring Keywords
MONITOR_KEYWORDS=breaking,trade,injury,suspension,fired,hired,championship,playoff
```

### Supported Rewrite Styles
- **Breaking News**: Urgent, hook-driven format
- **Analysis**: Expert commentary with context
- **Recap**: Chronological storytelling
- **Opinion**: Commentary with analysis
- **Quick Update**: Concise, direct format

### Video Length Options
- **Short** (30s): Hook + content + CTA
- **Medium** (60s): Extended content with analysis
- **Long** (120s): Comprehensive coverage with context

## 🔄 Workflow

1. **News Detection**: System scans RSS feeds every 5 minutes
2. **Breaking News Filter**: AI identifies urgent sports stories
3. **Content Processing**: 
   - Extracts key facts (names, dates, statistics)
   - Generates 2-3 rewritten versions
   - Validates fact accuracy
   - Scores originality (target: 85%+)
4. **Fliki Formatting**: Creates video-ready scripts with timing
5. **Discord Notification**: Sends copy-paste ready content
6. **Storage**: Saves processed content for reference

## 📈 Output Examples

### Original Story
"The Kansas City Chiefs announced that quarterback Patrick Mahomes suffered a minor ankle injury during Tuesday's practice session."

### Rewritten (Breaking Style)
"🚨 BREAKING: Chiefs superstar Patrick Mahomes picked up an ankle injury at practice today. But here's the good news: Coach Andy Reid says it's nothing serious, and Mahomes should be good to go this Sunday when they face the Broncos."

### Fliki Script Format
```
TITLE: Mahomes Injury Update - Chiefs Fans Can Breathe Easy

HOOK (0-3s): "Hold up Chiefs fans - we need to talk about Patrick Mahomes..."
MAIN (3-45s): "So here's what happened. Mahomes had a little ankle issue at practice today..."
CTA (45-50s): "If you want more breaking NFL news, smash that subscribe button..."

HASHTAGS: #NFL #Chiefs #Mahomes #Breaking #DeportesEnVivo
```

## 🛡️ Copyright Protection

- **85%+ Originality**: Automatic similarity checking
- **Fact Preservation**: 100% accuracy of key details
- **Phrase Replacement**: Synonym substitution
- **Structure Variation**: Different sentence order and flow
- **Voice Consistency**: Maintains channel's unique style

## 📱 Discord Features

### Breaking News Alerts
- Rich embeds with original vs rewritten content
- Originality scores and processing stats
- Key facts preservation validation
- Copy-paste ready Fliki scripts

### Daily Reports
- Total stories processed
- Breaking news by source/category
- Performance metrics
- Error summaries

## 🚨 Error Handling

- **API Rate Limits**: Automatic retries with backoff
- **Network Failures**: Fallback RSS sources
- **Processing Errors**: Discord alerts with context
- **Fact Validation**: AI-powered accuracy checking

## 📋 Monitoring Sources

### Primary Sources
- ESPN (General, NFL, NBA, MLB, Soccer)
- ESPN Deportes (Spanish)
- Yahoo Sports
- CBS Sports

### Keywords Monitored
- breaking, trade, injury, suspension
- fired, hired, championship, playoff
- Custom keywords configurable

## 🔧 Development

### Project Structure
```
├── lib/
│   ├── config.js           # Configuration and utilities
│   ├── ai-rewriter.js      # Core AI rewriting engine
│   ├── news-monitor.js     # News source monitoring
│   ├── fliki-formatter.js  # Video script formatting
│   └── discord-notifier.js # Discord integration
├── news-monitor.js         # Main monitoring script
├── test-rewriter.js        # Test suite
├── wsc-generate.js         # Original site generator
└── data/                   # Processed stories storage
```

### Adding New News Sources
Edit `lib/news-monitor.js` and add to `NEWS_SOURCES` array:
```javascript
{
  name: 'Source Name',
  url: 'https://example.com/rss',
  category: 'sport',
  language: 'en'
}
```

### Custom Rewrite Styles
Add new styles to `REWRITE_STYLES` in `lib/ai-rewriter.js`:
```javascript
custom: {
  name: "Custom Style",
  prompt: "Your custom prompt template...",
  defaultLength: "target duration"
}
```

## 📊 Success Metrics

- **Originality Score**: 85%+ different from source material
- **Fact Accuracy**: 100% preservation of key details
- **Processing Speed**: Rewrite generated within 30 seconds
- **Fliki Compatibility**: Scripts formatted perfectly for immediate use
- **Legal Safety**: Zero copyright infringement issues

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Run tests: `npm test`
4. Commit changes: `git commit -m 'Add new feature'`
5. Push to branch: `git push origin feature/new-feature`
6. Submit pull request

## 📄 License

This project is part of the West Side Cotorreo media system. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check the test suite: `npm test`
2. Review Discord notifications for error details
3. Check logs in console output
4. Verify API key configuration in .env

---

**Ready to transform breaking sports news into engaging, copyright-free video content!** 🎬⚡
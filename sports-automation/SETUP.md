# Setup Guide - Sports News Video Automation

Complete step-by-step guide to get your sports news video automation system running.

## 🚀 Quick Start (5 minutes)

1. **Install Dependencies**
   ```bash
   cd sports-automation
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp config/env-templates/.env.template .env
   # Edit .env with your API keys
   ```

3. **Test API Connections**
   ```bash
   npm test
   ```

4. **Start Webhook Server**
   ```bash
   npm start
   ```

## 📋 Detailed Setup

### Step 1: API Account Setup

#### Sports Data APIs
1. **API-Sports** (Primary source)
   - Visit: https://api-sports.io/
   - Subscribe to plan ($10-50/month)
   - Get API key from dashboard
   - Add to `.env`: `API_SPORTS_KEY=your_key_here`

2. **TheSportsDB** (Free backup)
   - Visit: https://www.thesportsdb.com/api.php
   - Free tier: 1000 requests/day
   - Paid tier: $3/month for more
   - Add to `.env`: `THESPORTSDB_KEY=your_key_here`

#### AI Content Generation
1. **OpenAI API**
   - Visit: https://platform.openai.com/
   - Add payment method
   - Generate API key
   - Add to `.env`: `OPENAI_API_KEY=your_key_here`

#### Video Generation
1. **Fliki AI**
   - Visit: https://fliki.ai/
   - Subscribe to API plan ($28-88/month)
   - Get API key from dashboard
   - Add to `.env`: `FLIKI_API_KEY=your_key_here`

#### YouTube Integration
1. **Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create project or select existing
   - Enable YouTube Data API v3
   - Create OAuth 2.0 credentials
   - Add to `.env`: `YOUTUBE_CLIENT_ID=...`, `YOUTUBE_CLIENT_SECRET=...`

### Step 2: Make.com Account Setup

1. **Sign up for Make.com**
   - Visit: https://make.com/
   - Choose Premium plan ($29/month) or higher
   - Note your team ID for API access

2. **Import Scenarios**
   - Download scenarios from `config/make-scenarios/`
   - In Make.com dashboard: Create > Import Blueprint
   - Upload JSON files
   - Configure connections for each scenario

3. **Configure Webhooks**
   - Create webhooks for each scenario
   - Add webhook URLs to `.env`
   - Test webhook connections

### Step 3: Testing & Validation

1. **Test Individual APIs**
   ```bash
   npm run test-sports    # Test sports data APIs
   npm run test-content   # Test content generation
   npm run test-video     # Test video generation APIs
   ```

2. **Test Complete Integration**
   ```bash
   npm test              # Test all APIs
   ```

3. **Start Monitoring**
   ```bash
   npm run monitor       # Check current status
   npm run webhook-server # Start webhook handler
   ```

### Step 4: Production Deployment

1. **Set Production Environment**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure Process Manager** (PM2 recommended)
   ```bash
   npm install -g pm2
   pm2 start scripts/webhooks/pause-resume-handler.js --name "sports-automation"
   pm2 save
   pm2 startup
   ```

3. **Setup Monitoring Cron Jobs**
   ```bash
   # Add to crontab (crontab -e)
   # Check costs every hour
   0 * * * * cd /path/to/sports-automation && node scripts/monitoring/cost-monitor.js status
   
   # Process retry queue every 10 minutes
   */10 * * * * cd /path/to/sports-automation && node scripts/error-handling/error-handler.js process-retries
   
   # Reset daily counters at midnight
   0 0 * * * cd /path/to/sports-automation && node scripts/monitoring/cost-monitor.js reset-daily
   ```

## ⚙️ Configuration

### Budget Settings
Edit your daily/weekly/monthly limits in `.env`:
```bash
DAILY_BUDGET_LIMIT=100.00
WEEKLY_BUDGET_LIMIT=500.00
MONTHLY_BUDGET_LIMIT=2000.00
```

### Sports Coverage
Enable/disable sports in `config/sports-sources/`:
```json
{
  "sports": {
    "nfl": { "enabled": true, "max_videos_per_day": 6 },
    "nba": { "enabled": true, "max_videos_per_day": 5 },
    "mlb": { "enabled": true, "max_videos_per_day": 4 },
    "nhl": { "enabled": false, "max_videos_per_day": 2 },
    "ufc": { "enabled": true, "max_videos_per_day": 3 }
  }
}
```

### Video Settings
Customize video generation in `.env`:
```bash
FLIKI_VOICE_ID=en-US-AriaNeural
FLIKI_VIDEO_RESOLUTION=1080p
VIDEOS_PER_DAY_TARGET=15
```

## 🔍 Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Error: "Too many requests"
   - Solution: Increase delays in Make.com scenarios
   - Check rate limit headers in logs

2. **Budget Exceeded**
   - Error: Workflows paused automatically
   - Solution: Check `npm run monitor`, adjust budgets
   - Resume: `npm run resume`

3. **Video Generation Fails**
   - Error: Fliki API errors
   - Solution: Check script length, content quality
   - Monitor retry queue: `node scripts/error-handling/error-handler.js stats`

4. **YouTube Upload Issues**
   - Error: Authentication failures
   - Solution: Refresh OAuth tokens
   - Check quota limits in Google Cloud Console

### Debug Commands

```bash
# Check system status
npm run monitor

# View error logs
node scripts/error-handling/error-handler.js stats

# Test specific API
npm run test-sports

# Manual cost tracking
npm run add-cost 5.00

# Force pause/resume
npm run pause
npm run resume
```

### Log Files
- `logs/error-log.json` - All errors and their status
- `logs/daily-costs.json` - Daily spending tracking
- `logs/api-usage.json` - API usage statistics
- `logs/workflow-state.json` - Current workflow status

## 📈 Scaling

### Performance Optimization
1. **Increase Concurrent Processing**
   - Edit `CONCURRENT_VIDEO_GENERATION=5` in `.env`
   - Monitor system resources

2. **Optimize API Calls**
   - Cache sports data for 2+ hours
   - Batch process similar content
   - Use lower-cost APIs when possible

3. **Improve Content Quality**
   - Fine-tune OpenAI prompts
   - A/B test video templates
   - Monitor engagement metrics

### Growth Strategy
1. **Phase 1: 10 videos/day** - Current setup
2. **Phase 2: 20 videos/day** - Multiple channels
3. **Phase 3: 50+ videos/day** - Enterprise scaling

## 🆘 Support

### Documentation
- [Make.com Guide](docs/make-com/README.md)
- [API Integrations](docs/api-integrations/README.md)
- [Cost Monitoring](docs/monitoring/README.md)

### Community
- GitHub Issues: Report bugs and request features
- Discord: Join our automation community
- Email: support@example.com

## ✅ Success Checklist

- [ ] All API keys configured in `.env`
- [ ] Make.com scenarios imported and connected
- [ ] Webhook server running on port 3000
- [ ] API tests passing: `npm test`
- [ ] Cost monitoring active: `npm run monitor`
- [ ] First video generated successfully
- [ ] Budget controls tested (pause/resume)
- [ ] Error handling validated
- [ ] Production deployment complete
- [ ] Monitoring cron jobs scheduled

**🎉 Congratulations!** Your sports news automation system is ready to generate 10-20 videos per day automatically.

---

**Next Steps**: Monitor your first day of operation and adjust settings based on performance metrics.
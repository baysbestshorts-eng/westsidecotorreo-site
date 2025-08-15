# WSC Breaking News Bot - Email Configuration

This bot monitors breaking sports news 24/7 and sends email alerts to basybestshorts@gmail.com.

## Quick Start

```bash
# Install dependencies
npm install

# Run demo (no credentials needed)
npm run demo

# Test bot structure
npm run test

# Run live monitoring (requires credentials)
npm run news-monitor
```

## Demo Mode

The demo mode shows the complete email workflow with mock sports stories:

```bash
npm run demo
```

This generates sample HTML emails saved to `demo-email-*.html` files that you can open in a browser to see the professional email layout.

## Required Environment Variables

Set these as GitHub repository secrets:

```
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-gmail-app-password  # Use App Password, not regular password
OPENAI_API_KEY=sk-your-openai-api-key
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this as EMAIL_PASSWORD (not your regular Gmail password)

## Email Delivery Schedule

- **Breaking News (8.0+ urgency)**: Immediate delivery
- **Trending Stories (6.0-7.9)**: Hourly digest at :00 minutes  
- **Daily Summary (4.0-5.9)**: 8 AM UTC with previous day's stories
- **Quiet Hours**: 11 PM - 6 AM UTC (no immediate alerts unless urgency ≥ 9.0)

## Monitoring Sources

- ESPN NFL, NBA, MLB RSS feeds
- CBS Sports headlines
- Yahoo Sports general feed
- Extensible to add more sources

## Story Processing

1. **Fetch** news from RSS feeds every 5 minutes
2. **Deduplicate** using story ID hash
3. **Score urgency** (0-10) based on keywords and timing
4. **Categorize** (Trade, Injury, Scandal, Record, etc.)
5. **Rewrite** with OpenAI (3 versions per story)
6. **Email** based on urgency level

## Email Content

Each breaking news email includes:
- Urgency score and category
- 3 AI-rewritten versions (Breaking/Analysis/Quick styles)
- Word counts for video timing
- Original source attribution
- Action recommendations for Make.com workflow

## GitHub Actions Workflow

- **Every 5 minutes**: Run breaking news monitoring
- **Every 12 hours**: Rebuild static site
- **Timeout**: 4 minutes per monitoring cycle
- **Concurrent**: Monitoring jobs don't cancel each other

## Error Handling

- Failed news sources are skipped, others continue
- Email failures are logged and retried
- OpenAI failures fall back to basic story versions
- Critical errors send notification emails

## Cost Considerations

- **Email**: Free (Gmail SMTP)
- **OpenAI**: ~$0.002 per story (GPT-3.5-turbo)
- **GitHub Actions**: ~2,000 minutes/month free tier
- **Bandwidth**: Minimal RSS feed requests

## Make.com Integration

Email content is optimized for copy-paste into Make.com:
- Pre-formatted story versions
- Clear action recommendations
- Word counts for video planning
- Urgency-based prioritization

## Local Testing Examples

```bash
# Test email configuration (requires credentials)
node -e "import('./breaking-news-bot.js').then(m => m.testEmailConfiguration())"

# Run single monitoring cycle (requires credentials)
node -e "import('./breaking-news-bot.js').then(m => m.monitorBreakingNews())"

# Test bot structure (no credentials needed)
npm run test

# Generate demo emails (no credentials needed)
npm run demo
```

## Files Overview

- `breaking-news-bot.js` - Main 24/7 monitoring bot
- `demo-news-bot.js` - Demo mode with mock data
- `test-bot-structure.js` - Structure validation tests
- `.github/workflows/pages.yml` - GitHub Actions configuration
- `NEWS_BOT_README.md` - This documentation

## Security Notes

- Never commit credentials to source code
- Use GitHub repository secrets for environment variables
- Gmail App Passwords are safer than regular passwords
- OpenAI API keys should be kept private

## Troubleshooting

### Email Not Sending
1. Verify EMAIL_USERNAME and EMAIL_PASSWORD are set correctly
2. Ensure 2FA is enabled on Gmail account
3. Use App Password, not regular Gmail password
4. Check that Gmail SMTP is not blocked by network

### OpenAI Errors
1. Verify OPENAI_API_KEY is valid and has credits
2. Check OpenAI API usage limits
3. Bot has fallback story versions if AI fails

### GitHub Actions Issues
1. Verify all secrets are set in repository settings
2. Check workflow logs for specific error messages
3. Ensure npm dependencies install correctly
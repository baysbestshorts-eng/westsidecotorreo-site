# API Integrations Guide

Complete setup guide for all required API integrations in the sports news automation workflow.

## 🏈 Sports Data APIs

### 1. API-Sports (Primary Source)
**Website**: https://api-sports.io/
**Cost**: $10-50/month depending on requests
**Rate Limits**: 100-1000 requests/day

#### Setup Steps
1. Register at API-Sports.io
2. Subscribe to plan (Football, Basketball, Baseball packages)
3. Get API key from dashboard
4. Test endpoints with Postman/curl

#### Key Endpoints
```javascript
// NFL Games & News
GET https://v1.american-football.api-sports.io/games
Headers: {
  'x-rapidapi-key': 'YOUR_API_KEY',
  'x-rapidapi-host': 'v1.american-football.api-sports.io'
}

// NBA Games & Stats  
GET https://v1.basketball.api-sports.io/games
Headers: {
  'x-rapidapi-key': 'YOUR_API_KEY',
  'x-rapidapi-host': 'v1.basketball.api-sports.io'
}

// MLB Games & Stats
GET https://v1.baseball.api-sports.io/games
Headers: {
  'x-rapidapi-key': 'YOUR_API_KEY',
  'x-rapidapi-host': 'v1.baseball.api-sports.io'
}
```

#### Sample Response Structure
```json
{
  "response": [
    {
      "game": {
        "id": 12345,
        "date": "2024-01-15",
        "time": "20:00",
        "status": {
          "long": "Game Finished",
          "short": "FT"
        }
      },
      "teams": {
        "home": {
          "id": 1,
          "name": "Los Angeles Lakers",
          "logo": "https://logo-url.png"
        },
        "away": {
          "id": 2, 
          "name": "Boston Celtics",
          "logo": "https://logo-url.png"
        }
      },
      "scores": {
        "home": 108,
        "away": 102
      }
    }
  ]
}
```

### 2. TheSportsDB (Secondary/Free Source)
**Website**: https://www.thesportsdb.com/api.php
**Cost**: Free (1000 requests/day), $3/month for more
**Rate Limits**: 1000 requests/day (free tier)

#### Key Endpoints
```javascript
// Latest NFL News
GET https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=NFL

// Team Information
GET https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=Lakers

// Recent Games
GET https://www.thesportsdb.com/api/v1/json/3/eventsround.php?id=4328&r=1
```

### 3. ESPN API (Supplementary)
**Website**: http://www.espn.com/apis/devcenter/
**Cost**: Free with rate limits
**Rate Limits**: ~1000 requests/hour

#### Key Endpoints
```javascript
// NFL Scores
GET http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard

// NBA Scores  
GET http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

// MLB Scores
GET http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard
```

## 🤖 AI Content Generation

### OpenAI GPT API
**Website**: https://platform.openai.com/
**Cost**: $0.002-0.02 per 1K tokens
**Rate Limits**: Varies by tier

#### Setup Steps
1. Create OpenAI account
2. Add payment method
3. Generate API key
4. Set usage limits

#### Script Generation Prompt Template
```javascript
const scriptPrompt = `
Create a 60-90 second sports news video script about:

Game: ${gameData.teams.home.name} vs ${gameData.teams.away.name}
Score: ${gameData.scores.home} - ${gameData.scores.away}
Date: ${gameData.game.date}
Sport: ${sport}

Requirements:
- Engaging hook in first 5 seconds
- Key highlights and stats
- Exciting tone suitable for sports fans
- Call-to-action to subscribe
- Exactly 150-200 words
- Include player names and standout performances

Format as natural speaking script with [PAUSE] markers.
`;
```

#### API Call Example
```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      {
        role: 'system', 
        content: 'You are a sports news script writer for YouTube videos.'
      },
      {
        role: 'user',
        content: scriptPrompt
      }
    ],
    max_tokens: 400,
    temperature: 0.7
  })
});
```

## 🎬 Fliki AI Video Generation

### Setup & Authentication
**Website**: https://fliki.ai/
**Cost**: $28-88/month for API access
**Limits**: 50-200 videos/month depending on plan

#### API Authentication
```javascript
const flikiAuth = {
  headers: {
    'Authorization': `Bearer ${process.env.FLIKI_API_KEY}`,
    'Content-Type': 'application/json'
  }
};
```

#### Video Generation Request
```javascript
const videoRequest = {
  script: generatedScript,
  voice: {
    id: 'en-US-AriaNeural', // Professional female voice
    speed: 1.0,
    pitch: 1.0
  },
  background: {
    type: 'image',
    url: sportsImageUrl
  },
  style: 'news',
  duration: 'auto', // Based on script length
  format: 'mp4',
  resolution: '1080p',
  aspectRatio: '16:9'
};

const response = await fetch('https://api.fliki.ai/v1/generate', {
  method: 'POST',
  ...flikiAuth,
  body: JSON.stringify(videoRequest)
});
```

#### Status Checking
```javascript
const checkStatus = async (jobId) => {
  const response = await fetch(`https://api.fliki.ai/v1/status/${jobId}`, {
    ...flikiAuth
  });
  return response.json();
};

// Poll every 30 seconds until complete
const pollForCompletion = async (jobId) => {
  let status = 'processing';
  while (status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 30000));
    const result = await checkStatus(jobId);
    status = result.status;
    if (status === 'completed') {
      return result.video_url;
    } else if (status === 'failed') {
      throw new Error('Video generation failed');
    }
  }
};
```

## 📺 YouTube Data API v3

### Setup Steps
1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (OAuth 2.0)
5. Configure consent screen

#### OAuth 2.0 Authentication Flow
```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// Set refresh token (obtained during initial auth)
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
});

const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});
```

#### Video Upload
```javascript
const uploadVideo = async (videoPath, metadata) => {
  const response = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: '17' // Sports category
      },
      status: {
        privacyStatus: 'public',
        publishAt: metadata.publishTime // Schedule for later
      }
    },
    media: {
      body: fs.createReadStream(videoPath)
    }
  });
  
  return response.data;
};
```

## 🖼️ Image Sources

### Unsplash API (Free Sports Images)
```javascript
const searchSportsImages = async (query) => {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=sports ${query}&per_page=10`,
    {
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    }
  );
  return response.json();
};
```

### Getty Images API (Premium)
```javascript
const gettyImageSearch = async (query) => {
  const response = await fetch(
    `https://api.gettyimages.com/v3/search/images?phrase=sports ${query}`,
    {
      headers: {
        'Api-Key': process.env.GETTY_API_KEY
      }
    }
  );
  return response.json();
};
```

## 📱 Notification Services

### Twilio SMS Alerts
```javascript
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendAlert = async (message) => {
  await twilio.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.ADMIN_PHONE_NUMBER
  });
};
```

## 🔧 Testing Your Integrations

Use the testing scripts in `../../tools/testing/` to validate all API connections:

```bash
node tools/testing/test-sports-apis.js
node tools/testing/test-fliki-integration.js  
node tools/testing/test-youtube-upload.js
```

---

**Next Steps**: [Fliki AI Integration Details](../fliki-ai/README.md)
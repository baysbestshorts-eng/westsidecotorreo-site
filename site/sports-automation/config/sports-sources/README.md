# Sports Data Source Configurations

Configuration templates for various sports data providers and their integration settings.

## 🏈 NFL Configuration

### API-Sports NFL Configuration
```json
{
  "provider": "api-sports",
  "sport": "american-football", 
  "league_id": 1,
  "season": "2024",
  "endpoints": {
    "games": "https://v1.american-football.api-sports.io/games",
    "standings": "https://v1.american-football.api-sports.io/standings",
    "teams": "https://v1.american-football.api-sports.io/teams",
    "players": "https://v1.american-football.api-sports.io/players"
  },
  "rate_limits": {
    "requests_per_day": 1000,
    "requests_per_minute": 10
  },
  "cache_duration": "2h",
  "priority": 1
}
```

### ESPN NFL Configuration
```json
{
  "provider": "espn",
  "sport": "football",
  "league": "nfl",
  "endpoints": {
    "scoreboard": "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "teams": "http://site.api.espn.com/apis/site/v2/sports/football/nfl/teams",
    "news": "http://site.api.espn.com/apis/site/v2/sports/football/nfl/news"
  },
  "rate_limits": {
    "requests_per_hour": 1000
  },
  "cache_duration": "1h",
  "priority": 2
}
```

## 🏀 NBA Configuration

### API-Sports NBA Configuration
```json
{
  "provider": "api-sports",
  "sport": "basketball",
  "league_id": 12,
  "season": "2024-2025",
  "endpoints": {
    "games": "https://v1.basketball.api-sports.io/games",
    "standings": "https://v1.basketball.api-sports.io/standings",
    "teams": "https://v1.basketball.api-sports.io/teams",
    "players": "https://v1.basketball.api-sports.io/players",
    "statistics": "https://v1.basketball.api-sports.io/statistics"
  },
  "rate_limits": {
    "requests_per_day": 1000,
    "requests_per_minute": 10
  },
  "cache_duration": "2h",
  "priority": 1
}
```

## ⚾ MLB Configuration

### API-Sports MLB Configuration
```json
{
  "provider": "api-sports",
  "sport": "baseball",
  "league_id": 1,
  "season": "2024",
  "endpoints": {
    "games": "https://v1.baseball.api-sports.io/games",
    "standings": "https://v1.baseball.api-sports.io/standings",
    "teams": "https://v1.baseball.api-sports.io/teams"
  },
  "rate_limits": {
    "requests_per_day": 1000,
    "requests_per_minute": 10
  },
  "cache_duration": "2h",
  "priority": 1
}
```

## 🏒 NHL Configuration

### TheSportsDB NHL Configuration
```json
{
  "provider": "thesportsdb",
  "sport": "ice-hockey",
  "league": "NHL",
  "endpoints": {
    "events": "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4380",
    "teams": "https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=NHL",
    "players": "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t="
  },
  "rate_limits": {
    "requests_per_day": 1000
  },
  "cache_duration": "3h",
  "priority": 2
}
```

## 🥊 UFC/MMA Configuration

### TheSportsDB UFC Configuration  
```json
{
  "provider": "thesportsdb",
  "sport": "fighting",
  "league": "UFC",
  "endpoints": {
    "events": "https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4443",
    "fighters": "https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t="
  },
  "rate_limits": {
    "requests_per_day": 1000
  },
  "cache_duration": "6h",
  "priority": 3
}
```

## 📊 Combined Sports Configuration

### Master Sports Configuration
```json
{
  "sports": {
    "nfl": {
      "enabled": true,
      "priority": 1,
      "max_videos_per_day": 6,
      "peak_hours": [17, 18, 19, 20, 21],
      "keywords": ["NFL", "football", "touchdown", "quarterback", "patriots", "cowboys"],
      "hashtags": ["#NFL", "#Football", "#AmericanFootball"]
    },
    "nba": {
      "enabled": true,
      "priority": 1,
      "max_videos_per_day": 5,
      "peak_hours": [19, 20, 21, 22],
      "keywords": ["NBA", "basketball", "Lakers", "Warriors", "LeBron", "Curry"],
      "hashtags": ["#NBA", "#Basketball", "#Hoops"]
    },
    "mlb": {
      "enabled": true,
      "priority": 2,
      "max_videos_per_day": 4,
      "peak_hours": [18, 19, 20, 21],
      "keywords": ["MLB", "baseball", "Dodgers", "Yankees", "World Series"],
      "hashtags": ["#MLB", "#Baseball", "#HomeRun"]
    },
    "nhl": {
      "enabled": true,
      "priority": 3,
      "max_videos_per_day": 2,
      "peak_hours": [19, 20, 21],
      "keywords": ["NHL", "hockey", "Stanley Cup", "goal"],
      "hashtags": ["#NHL", "#Hockey", "#StanleyCup"]
    },
    "ufc": {
      "enabled": true,
      "priority": 2,
      "max_videos_per_day": 3,
      "peak_hours": [20, 21, 22, 23],
      "keywords": ["UFC", "MMA", "fight", "knockout", "submission"],
      "hashtags": ["#UFC", "#MMA", "#Fighting"]
    }
  },
  "content_filters": {
    "min_relevance_score": 7.0,
    "exclude_keywords": ["injury", "suspended", "arrest", "controversy"],
    "required_elements": ["score", "team_names", "date"],
    "max_age_hours": 24
  },
  "scheduling": {
    "timezone": "America/Los_Angeles",
    "business_hours": {
      "start": 6,
      "end": 22
    },
    "weekend_multiplier": 1.2,
    "holiday_multiplier": 0.8
  }
}
```

## 🔧 Integration Settings

### Make.com Integration
```json
{
  "webhooks": {
    "data_collection": "${MAKE_WEBHOOK_DATA_COLLECTION}",
    "content_processing": "${MAKE_WEBHOOK_CONTENT_PROCESSING}",
    "video_generation": "${MAKE_WEBHOOK_VIDEO_GENERATION}",
    "publishing": "${MAKE_WEBHOOK_PUBLISHING}"
  },
  "scenarios": {
    "data_collection": "${MAKE_SCENARIO_ID_DATA_COLLECTION}",
    "content_processing": "${MAKE_SCENARIO_ID_CONTENT_PROCESSING}",
    "video_generation": "${MAKE_SCENARIO_ID_VIDEO_GENERATION}",
    "publishing": "${MAKE_SCENARIO_ID_PUBLISHING}",
    "monitoring": "${MAKE_SCENARIO_ID_MONITORING}"
  }
}
```

### Content Generation Settings
```json
{
  "script_templates": {
    "game_result": {
      "structure": [
        "hook_line",
        "game_summary", 
        "key_highlights",
        "standout_performances",
        "call_to_action"
      ],
      "target_length": "150-200 words",
      "tone": "exciting, energetic"
    },
    "breaking_news": {
      "structure": [
        "breaking_announcement",
        "key_details",
        "context_background",
        "impact_analysis",
        "call_to_action"
      ],
      "target_length": "120-180 words",
      "tone": "urgent, informative"
    }
  },
  "openai_settings": {
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 400,
    "presence_penalty": 0.1,
    "frequency_penalty": 0.1
  }
}
```

### Video Generation Settings
```json
{
  "fliki_settings": {
    "default_voice": "en-US-AriaNeural",
    "voice_speed": 1.0,
    "voice_pitch": 1.0,
    "video_resolution": "1080p",
    "aspect_ratio": "16:9",
    "background_style": "sports_theme",
    "include_captions": true,
    "brand_overlay": true
  },
  "quality_controls": {
    "min_duration": 45,
    "max_duration": 120,
    "audio_quality_check": true,
    "visual_quality_check": true,
    "content_compliance_check": true
  }
}
```

## 📈 Analytics Configuration

```json
{
  "tracking": {
    "video_performance": true,
    "cost_tracking": true,
    "api_usage_tracking": true,
    "error_tracking": true
  },
  "reporting": {
    "daily_summary": true,
    "weekly_analytics": true,
    "monthly_reports": true,
    "real_time_alerts": true
  },
  "metrics": {
    "views_per_video": true,
    "engagement_rate": true,
    "cost_per_video": true,
    "api_success_rate": true,
    "generation_speed": true
  }
}
```

---

**Usage**: Copy these configurations to your environment and customize the values according to your specific requirements and API access levels.
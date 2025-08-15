#!/usr/bin/env node

/**
 * API Integration Testing Script
 * Tests all required API connections and validates responses
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

dotenv.config();

class APITester {
  constructor() {
    this.results = {
      sportsAPIs: {},
      contentGeneration: {},
      videoGeneration: {},
      imageAPIs: {},
      youtube: {},
      notifications: {}
    };
  }

  async testAll() {
    console.log('🧪 Starting comprehensive API testing...\n');
    
    await this.testSportsAPIs();
    await this.testContentGeneration();
    await this.testVideoGeneration();
    await this.testImageAPIs();
    await this.testYouTubeAPI();
    await this.testNotifications();
    
    this.printSummary();
    return this.results;
  }

  async testSportsAPIs() {
    console.log('🏈 Testing Sports APIs...');
    
    // Test API-Sports
    try {
      const response = await fetch('https://v1.american-football.api-sports.io/games?season=2024&league=1', {
        headers: {
          'x-rapidapi-key': process.env.API_SPORTS_KEY,
          'x-rapidapi-host': 'v1.american-football.api-sports.io'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.results.sportsAPIs.apiSports = {
          status: 'SUCCESS',
          responseTime: response.headers.get('x-response-time'),
          gamesCount: data.response?.length || 0,
          rateLimit: response.headers.get('x-ratelimit-remaining')
        };
        console.log('✅ API-Sports: Connected successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.results.sportsAPIs.apiSports = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ API-Sports: Failed -', error.message);
    }

    // Test TheSportsDB
    try {
      const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/searchevents.php?e=NFL');
      
      if (response.ok) {
        const data = await response.json();
        this.results.sportsAPIs.theSportsDB = {
          status: 'SUCCESS',
          eventsCount: data.event?.length || 0
        };
        console.log('✅ TheSportsDB: Connected successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.results.sportsAPIs.theSportsDB = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ TheSportsDB: Failed -', error.message);
    }

    // Test ESPN API
    try {
      const response = await fetch('http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
      
      if (response.ok) {
        const data = await response.json();
        this.results.sportsAPIs.espn = {
          status: 'SUCCESS',
          gamesCount: data.events?.length || 0
        };
        console.log('✅ ESPN API: Connected successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.results.sportsAPIs.espn = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ ESPN API: Failed -', error.message);
    }
  }

  async testContentGeneration() {
    console.log('\n🤖 Testing Content Generation APIs...');
    
    // Test OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are testing the API connection. Respond with a simple acknowledgment.'
            },
            {
              role: 'user',
              content: 'Test connection'
            }
          ],
          max_tokens: 50
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.results.contentGeneration.openai = {
          status: 'SUCCESS',
          model: data.model,
          tokensUsed: data.usage?.total_tokens || 0,
          responseLength: data.choices?.[0]?.message?.content?.length || 0
        };
        console.log('✅ OpenAI API: Connected successfully');
      } else {
        const errorData = await response.json();
        throw new Error(`${errorData.error?.message || response.statusText}`);
      }
    } catch (error) {
      this.results.contentGeneration.openai = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ OpenAI API: Failed -', error.message);
    }
  }

  async testVideoGeneration() {
    console.log('\n🎬 Testing Video Generation APIs...');
    
    // Test Fliki AI API - just check authentication
    try {
      const response = await fetch('https://api.fliki.ai/v1/voices', {
        headers: {
          'Authorization': `Bearer ${process.env.FLIKI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.results.videoGeneration.fliki = {
          status: 'SUCCESS',
          voicesAvailable: Array.isArray(data) ? data.length : 'Unknown',
          rateLimit: response.headers.get('x-ratelimit-remaining')
        };
        console.log('✅ Fliki AI: Connected successfully');
      } else {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      this.results.videoGeneration.fliki = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ Fliki AI: Failed -', error.message);
    }
  }

  async testImageAPIs() {
    console.log('\n🖼️ Testing Image APIs...');
    
    // Test Unsplash API
    try {
      const response = await fetch(
        'https://api.unsplash.com/search/photos?query=sports&per_page=1',
        {
          headers: {
            'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.results.imageAPIs.unsplash = {
          status: 'SUCCESS',
          totalImages: data.total,
          rateLimit: response.headers.get('x-ratelimit-remaining')
        };
        console.log('✅ Unsplash API: Connected successfully');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.results.imageAPIs.unsplash = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ Unsplash API: Failed -', error.message);
    }

    // Test Getty Images API (if configured)
    if (process.env.GETTY_API_KEY) {
      try {
        const response = await fetch(
          'https://api.gettyimages.com/v3/search/images?phrase=sports&page_size=1',
          {
            headers: {
              'Api-Key': process.env.GETTY_API_KEY
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          this.results.imageAPIs.getty = {
            status: 'SUCCESS',
            totalImages: data.result_count
          };
          console.log('✅ Getty Images API: Connected successfully');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        this.results.imageAPIs.getty = {
          status: 'FAILED',
          error: error.message
        };
        console.log('❌ Getty Images API: Failed -', error.message);
      }
    } else {
      this.results.imageAPIs.getty = {
        status: 'SKIPPED',
        reason: 'API key not configured'
      };
      console.log('⏭️ Getty Images API: Skipped (no API key)');
    }
  }

  async testYouTubeAPI() {
    console.log('\n📺 Testing YouTube API...');
    
    try {
      // Test if we can get channel info (requires OAuth setup)
      if (process.env.YOUTUBE_ACCESS_TOKEN) {
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&access_token=${process.env.YOUTUBE_ACCESS_TOKEN}`
        );

        if (response.ok) {
          const data = await response.json();
          this.results.youtube.api = {
            status: 'SUCCESS',
            channelCount: data.items?.length || 0,
            quotaUsed: 1 // Each API call uses quota
          };
          console.log('✅ YouTube API: Connected successfully');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } else {
        this.results.youtube.api = {
          status: 'SKIPPED',
          reason: 'Access token not configured'
        };
        console.log('⏭️ YouTube API: Skipped (no access token)');
      }
    } catch (error) {
      this.results.youtube.api = {
        status: 'FAILED',
        error: error.message
      };
      console.log('❌ YouTube API: Failed -', error.message);
    }
  }

  async testNotifications() {
    console.log('\n📱 Testing Notification Services...');
    
    // Test Twilio (if configured)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        // Just test account info, don't send actual SMS
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}.json`,
          {
            headers: {
              'Authorization': `Basic ${auth}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          this.results.notifications.twilio = {
            status: 'SUCCESS',
            accountStatus: data.status
          };
          console.log('✅ Twilio: Connected successfully');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        this.results.notifications.twilio = {
          status: 'FAILED',
          error: error.message
        };
        console.log('❌ Twilio: Failed -', error.message);
      }
    } else {
      this.results.notifications.twilio = {
        status: 'SKIPPED',
        reason: 'Credentials not configured'
      };
      console.log('⏭️ Twilio: Skipped (no credentials)');
    }
  }

  printSummary() {
    console.log('\n📊 API Testing Summary');
    console.log('=' .repeat(50));
    
    const categories = [
      { name: 'Sports APIs', key: 'sportsAPIs' },
      { name: 'Content Generation', key: 'contentGeneration' },
      { name: 'Video Generation', key: 'videoGeneration' },
      { name: 'Image APIs', key: 'imageAPIs' },
      { name: 'YouTube', key: 'youtube' },
      { name: 'Notifications', key: 'notifications' }
    ];

    let totalTests = 0;
    let passedTests = 0;

    categories.forEach(category => {
      console.log(`\n${category.name}:`);
      const results = this.results[category.key];
      
      Object.entries(results).forEach(([api, result]) => {
        totalTests++;
        const status = result.status;
        const icon = status === 'SUCCESS' ? '✅' : 
                    status === 'FAILED' ? '❌' : 
                    '⏭️';
        
        if (status === 'SUCCESS') passedTests++;
        
        console.log(`  ${icon} ${api}: ${status}`);
        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Overall Success Rate: ${passedTests}/${totalTests} (${((passedTests/totalTests) * 100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All configured APIs are working correctly!');
    } else if (passedTests / totalTests >= 0.7) {
      console.log('⚠️ Most APIs are working, but some issues detected.');
    } else {
      console.log('🚨 Significant API issues detected. Check configuration.');
    }
  }

  async saveResults(filename = 'api-test-results.json') {
    const resultsWithTimestamp = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: this.getTotalTests(),
        passedTests: this.getPassedTests(),
        successRate: this.getSuccessRate()
      }
    };

    const fs = await import('fs/promises');
    await fs.writeFile(filename, JSON.stringify(resultsWithTimestamp, null, 2));
    console.log(`\n💾 Results saved to ${filename}`);
  }

  getTotalTests() {
    let total = 0;
    Object.values(this.results).forEach(category => {
      total += Object.keys(category).length;
    });
    return total;
  }

  getPassedTests() {
    let passed = 0;
    Object.values(this.results).forEach(category => {
      Object.values(category).forEach(result => {
        if (result.status === 'SUCCESS') passed++;
      });
    });
    return passed;
  }

  getSuccessRate() {
    const total = this.getTotalTests();
    const passed = this.getPassedTests();
    return total > 0 ? (passed / total * 100).toFixed(1) : 0;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new APITester();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'all':
    case undefined:
      await tester.testAll();
      await tester.saveResults();
      break;
      
    case 'sports':
      await tester.testSportsAPIs();
      break;
      
    case 'content':
      await tester.testContentGeneration();
      break;
      
    case 'video':
      await tester.testVideoGeneration();
      break;
      
    case 'images':
      await tester.testImageAPIs();
      break;
      
    case 'youtube':
      await tester.testYouTubeAPI();
      break;
      
    case 'notifications':
      await tester.testNotifications();
      break;
      
    default:
      console.log(`
Usage: node test-api-integrations.js [category]

Categories:
  all (default)  - Test all APIs
  sports         - Test sports data APIs
  content        - Test content generation APIs  
  video          - Test video generation APIs
  images         - Test image APIs
  youtube        - Test YouTube API
  notifications  - Test notification services

Examples:
  node test-api-integrations.js
  node test-api-integrations.js sports
  node test-api-integrations.js content
      `);
  }
}

export default APITester;
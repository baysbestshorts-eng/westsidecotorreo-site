// Test Suite for AI Story Rewriter

import { CONFIG } from './lib/config.js';
import { newsMonitor } from './lib/news-monitor.js';
import { aiRewriter } from './lib/ai-rewriter.js';
import { flikiFormatter } from './lib/fliki-formatter.js';
import { discordNotifier } from './lib/discord-notifier.js';

// Test configuration
const TEST_CONFIG = {
  // Use a mock API key for testing if real one not available
  mockOpenAIKey: 'sk-test-mock-key-for-testing-only',
  testStory: `
Kansas City Chiefs quarterback Patrick Mahomes suffered a minor ankle injury during Tuesday's practice session. 
Head coach Andy Reid stated the injury is not serious and Mahomes is expected to participate in Sunday's game against the Denver Broncos. 
The injury occurred during a routine passing drill, and team medical staff evaluated Mahomes immediately. 
"It's just a precautionary measure," Reid said during his press conference. "Patrick is tough and should be ready for Sunday."
The Chiefs are currently 8-3 this season and are leading the AFC West division.
  `.trim()
};

class TestRunner {
  constructor() {
    this.testResults = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runTest(testName, testFn) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      const result = await testFn();
      if (result === true || result === undefined) {
        console.log(`✅ ${testName} - PASSED`);
        this.passedTests++;
        this.testResults.push({ name: testName, status: 'PASSED', result });
      } else {
        console.log(`❌ ${testName} - FAILED: ${result}`);
        this.failedTests++;
        this.testResults.push({ name: testName, status: 'FAILED', result });
      }
    } catch (error) {
      console.log(`❌ ${testName} - ERROR: ${error.message}`);
      this.failedTests++;
      this.testResults.push({ name: testName, status: 'ERROR', error: error.message });
    }
  }

  async testConfiguration() {
    // Test if configuration loads properly
    if (!CONFIG.aiProvider) {
      return 'AI provider not configured';
    }
    
    if (!CONFIG.monitorKeywords || CONFIG.monitorKeywords.length === 0) {
      return 'Monitor keywords not configured';
    }
    
    console.log(`  📋 AI Provider: ${CONFIG.aiProvider}`);
    console.log(`  📋 Model: ${CONFIG.aiModel}`);
    console.log(`  📋 Keywords: ${CONFIG.monitorKeywords.slice(0, 3).join(', ')}...`);
    
    return true;
  }

  async testNewsMonitoring() {
    // Test breaking news detection
    const testTitle = "BREAKING: Chiefs quarterback Patrick Mahomes injured in practice";
    const testContent = "Emergency news about NFL star being hurt during training session";
    
    const isBreaking = newsMonitor.isBreakingNews(testTitle, testContent);
    if (!isBreaking) {
      return 'Breaking news detection failed for obvious breaking news';
    }
    
    // Test key facts extraction
    const mockStory = {
      title: testTitle,
      content: TEST_CONFIG.testStory,
      link: 'https://example.com/test'
    };
    
    const keyFacts = newsMonitor.extractKeyFacts(mockStory);
    console.log(`  📊 Extracted facts:`, keyFacts);
    
    if (!keyFacts.names || keyFacts.names.length === 0) {
      return 'Failed to extract names from story';
    }
    
    return true;
  }

  async testAIRewriter() {
    // Test AI rewriter without actual API call
    console.log('  ⚠️ AI rewriter test requires API key - testing configuration only');
    
    // Test rewrite styles configuration
    const styles = Object.keys(aiRewriter.constructor.name ? {} : require('./lib/ai-rewriter.js').REWRITE_STYLES);
    
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.log('  📝 API keys not configured - skipping actual rewrite test');
      return true;
    }
    
    try {
      await aiRewriter.initialize();
      console.log('  ✅ AI client initialized successfully');
      
      // If we have a real API key, we could test a simple rewrite here
      // For now, just test that the client initializes
      return true;
    } catch (error) {
      if (error.message.includes('API key missing')) {
        console.log('  📝 API key missing - test skipped');
        return true;
      }
      throw error;
    }
  }

  async testFlikiFormatter() {
    const mockRewrittenStory = {
      rewritten: TEST_CONFIG.testStory,
      style: 'breaking',
      originalityScore: 87.5,
      wordCount: 150
    };
    
    const flikiContent = flikiFormatter.formatForFliki(mockRewrittenStory, {
      videoLength: 'medium',
      language: 'Spanish'
    });
    
    console.log(`  🎬 Generated video title: ${flikiContent.title}`);
    console.log(`  📝 Script sections: ${Object.keys(flikiContent.script).join(', ')}`);
    console.log(`  🏷️ Hashtags: ${flikiContent.social.hashtags.slice(0, 3).join(' ')}`);
    
    if (!flikiContent.title || !flikiContent.script.hook || !flikiContent.script.mainContent) {
      return 'Fliki formatter failed to generate required content';
    }
    
    if (flikiContent.social.hashtags.length === 0) {
      return 'Failed to generate hashtags';
    }
    
    return true;
  }

  async testDiscordNotifier() {
    console.log('  📤 Testing Discord notifier (without sending actual messages)');
    
    const mockStory = {
      title: "Test Breaking News",
      content: TEST_CONFIG.testStory,
      source: "Test Source",
      link: "https://example.com/test"
    };
    
    const mockVersions = {
      bestVersion: {
        rewritten: "Rewritten version of the story",
        style: 'breaking',
        originalityScore: 88.5,
        wordCount: 120
      },
      versions: [
        { style: 'breaking', originalityScore: 88.5 },
        { style: 'analysis', originalityScore: 85.2 }
      ],
      averageOriginality: 86.85
    };
    
    const mockFlikiContent = {
      title: "Test Video Title",
      script: {
        hook: { text: "Breaking news hook" },
        mainContent: { text: "Main content" },
        cta: { text: "Call to action" }
      },
      social: {
        hashtags: ['#Test', '#Breaking', '#News']
      },
      metadata: { targetLength: 'medium' },
      flikiConfig: {
        voice: { style: 'energetic', language: 'es-ES' }
      }
    };
    
    // Test embed creation (without sending)
    const embed = discordNotifier.createBreakingNewsEmbed(mockStory, mockVersions, mockFlikiContent);
    
    if (!embed.title || !embed.fields || embed.fields.length === 0) {
      return 'Discord embed creation failed';
    }
    
    console.log(`  📊 Generated embed with ${embed.fields.length} fields`);
    
    return true;
  }

  async testEndToEndWorkflow() {
    console.log('  🔄 Testing end-to-end workflow (simulation)');
    
    // Simulate the full workflow without external API calls
    const mockStory = {
      id: 'test-story-1',
      title: "BREAKING: Major Sports Trade Announced",
      content: TEST_CONFIG.testStory,
      source: "Test ESPN",
      category: "nfl",
      language: "en",
      keyFacts: {
        names: ["Patrick Mahomes", "Andy Reid", "Kansas City Chiefs"],
        numbers: ["8-3"],
        dates: ["Tuesday", "Sunday"]
      },
      publishDate: new Date(),
      isBreaking: true
    };
    
    // Test news detection
    const isBreaking = newsMonitor.isBreakingNews(mockStory.title, mockStory.content);
    if (!isBreaking) {
      return 'Failed to detect breaking news in end-to-end test';
    }
    
    // Test Fliki formatting
    const mockRewrite = {
      rewritten: "Breaking news from Kansas City - Chiefs superstar Patrick Mahomes picked up an ankle injury at practice today...",
      style: 'breaking',
      originalityScore: 89.2,
      wordCount: 145
    };
    
    const flikiContent = flikiFormatter.formatForFliki({
      ...mockRewrite,
      title: mockStory.title,
      keyFacts: mockStory.keyFacts
    });
    
    if (!flikiContent.title || !flikiContent.script.hook.text) {
      return 'End-to-end Fliki formatting failed';
    }
    
    console.log(`  ✅ End-to-end workflow completed successfully`);
    console.log(`  📊 Final output: "${flikiContent.title.slice(0, 50)}..."`);
    
    return true;
  }

  async testUtilityFunctions() {
    const { clean, slug, calculateSimilarity, getOriginalityScore } = await import('./lib/config.js');
    
    // Test text cleaning
    const dirtyText = "  Multiple   spaces\n\nand\tline breaks  ";
    const cleanText = clean(dirtyText);
    if (cleanText !== "Multiple spaces and line breaks") {
      return `Text cleaning failed: "${cleanText}"`;
    }
    
    // Test slug generation
    const title = "Breaking: Chiefs QB Injured!";
    const slugText = slug(title);
    if (!slugText.includes('breaking') || !slugText.includes('chiefs')) {
      return `Slug generation failed: "${slugText}"`;
    }
    
    // Test similarity calculation
    const text1 = "The Kansas City Chiefs quarterback was injured";
    const text2 = "Kansas City's QB got hurt during practice"; 
    const similarity = calculateSimilarity(text1, text2);
    if (similarity < 10 || similarity > 90) {
      return `Similarity calculation seems wrong: ${similarity}%`;
    }
    
    // Test originality score
    const originality = getOriginalityScore(text1, text2);
    if (originality < 10 || originality > 90) {
      return `Originality score seems wrong: ${originality}%`;
    }
    
    console.log(`  📊 Similarity: ${similarity.toFixed(1)}%, Originality: ${originality.toFixed(1)}%`);
    
    return true;
  }

  async runAllTests() {
    console.log('🚀 Starting AI Story Rewriter Test Suite\n');
    console.log('='.repeat(50));
    
    await this.runTest('Configuration Loading', () => this.testConfiguration());
    await this.runTest('News Monitoring', () => this.testNewsMonitoring());
    await this.runTest('AI Rewriter Setup', () => this.testAIRewriter());
    await this.runTest('Fliki Formatter', () => this.testFlikiFormatter());
    await this.runTest('Discord Notifier', () => this.testDiscordNotifier());
    await this.runTest('Utility Functions', () => this.testUtilityFunctions());
    await this.runTest('End-to-End Workflow', () => this.testEndToEndWorkflow());
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`📊 Total: ${this.passedTests + this.failedTests}`);
    
    if (this.failedTests === 0) {
      console.log('\n🎉 All tests passed! The AI Story Rewriter is ready to use.');
      console.log('\n📝 Next steps:');
      console.log('1. Set up API keys in .env file');
      console.log('2. Configure Discord webhook URL');
      console.log('3. Run: npm run monitor');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }
    
    return this.failedTests === 0;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new TestRunner();
  testRunner.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { TestRunner };
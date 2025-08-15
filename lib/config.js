// AI Story Rewriter - Configuration and Utilities

import { config } from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
config();

export const CONFIG = {
  // AI Configuration
  aiProvider: process.env.AI_PROVIDER || 'openai',
  aiModel: process.env.AI_MODEL || 'gpt-4-turbo-preview',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  
  // Discord Configuration
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  
  // News APIs
  espnApiKey: process.env.ESPN_API_KEY,
  sportsApiKey: process.env.SPORTS_API_KEY,
  
  // Processing Settings
  maxStoriesPerHour: parseInt(process.env.MAX_STORIES_PER_HOUR) || 20,
  rewriteVersions: parseInt(process.env.REWRITE_VERSIONS) || 3,
  targetOriginalityScore: parseInt(process.env.TARGET_ORIGINALITY_SCORE) || 85,
  processingTimeout: parseInt(process.env.PROCESSING_TIMEOUT) || 30000,
  
  // Monitoring Settings
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES) || 5,
  monitorKeywords: (process.env.MONITOR_KEYWORDS || 'breaking,trade,injury,suspension,fired,hired,championship,playoff').split(',')
};

// Initialize AI client
export const initializeAI = () => {
  if (CONFIG.aiProvider === 'openai' && CONFIG.openaiApiKey) {
    return new OpenAI({
      apiKey: CONFIG.openaiApiKey,
    });
  }
  // TODO: Add Anthropic initialization when needed
  throw new Error(`AI provider ${CONFIG.aiProvider} not configured or API key missing`);
};

// Utility functions
export const clean = s => (s || "").toString().replace(/\s+/g, " ").trim();

export const slug = s => clean(s).toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export const calculateSimilarity = (text1, text2) => {
  // Simple similarity calculation - could be enhanced with more sophisticated algorithms
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return totalWords > 0 ? (commonWords.length / totalWords) * 100 : 0;
};

export const getOriginalityScore = (original, rewritten) => {
  const similarity = calculateSimilarity(original, rewritten);
  return Math.max(0, 100 - similarity);
};

// Export validation functions
export const validateConfig = () => {
  const requiredFields = [
    'aiProvider',
    CONFIG.aiProvider === 'openai' ? 'openaiApiKey' : 'anthropicApiKey'
  ];
  
  const missing = requiredFields.filter(field => !CONFIG[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  return true;
};
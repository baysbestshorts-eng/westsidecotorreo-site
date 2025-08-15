// AI Story Rewriter - Core Rewriting Engine

import { CONFIG, initializeAI, clean, getOriginalityScore } from './config.js';

// Rewriting style templates
export const REWRITE_STYLES = {
  breaking: {
    name: "Breaking News Style",
    prompt: `Rewrite this sports news story as breaking news for a YouTube video script.
    
Requirements:
- Start with urgent hook: "Breaking news..." or "Just in..."
- Use excited, urgent tone appropriate for sports fans
- Maintain ALL facts: names, dates, statistics, quotes exactly
- Structure for video narration with natural pauses
- Keep it engaging and YouTube-friendly
- Target length: {targetLength}
- Write in {language}

Original story: "{originalStory}"

Rewritten breaking news script:`,
    defaultLength: "45-60 seconds"
  },
  
  analysis: {
    name: "Analysis Style", 
    prompt: `Rewrite this sports story as analytical commentary for a YouTube video script.

Requirements:
- Start with "Here's what this means for..." or "Let me break this down..."
- Provide expert analysis and context
- Maintain ALL facts: names, dates, statistics, quotes exactly
- Explain implications and impact
- Use analytical but accessible tone
- Structure for video narration
- Target length: {targetLength}
- Write in {language}

Original story: "{originalStory}"

Rewritten analysis script:`,
    defaultLength: "1-2 minutes"
  },
  
  recap: {
    name: "Story Recap Style",
    prompt: `Rewrite this sports story as a story recap for a YouTube video script.

Requirements:
- Start with "Let me catch you up on..." or "Here's what happened..."
- Tell the story chronologically
- Maintain ALL facts: names, dates, statistics, quotes exactly
- Use conversational, storytelling tone
- Structure for video narration with good pacing
- Target length: {targetLength}
- Write in {language}

Original story: "{originalStory}"

Rewritten recap script:`,
    defaultLength: "30-45 seconds"
  },
  
  opinion: {
    name: "Opinion Commentary",
    prompt: `Rewrite this sports story as opinion commentary for a YouTube video script.

Requirements:
- Start with "This is huge because..." or "My take on this..."
- Add legitimate sports analysis and opinion
- Maintain ALL facts: names, dates, statistics, quotes exactly
- Use passionate but informed tone
- Structure for video narration
- Target length: {targetLength}
- Write in {language}

Original story: "{originalStory}"

Rewritten opinion commentary:`,
    defaultLength: "1-2 minutes"
  },
  
  quick: {
    name: "Quick Update",
    prompt: `Rewrite this sports story as a quick update for a YouTube video script.

Requirements:
- Start with "Quick update on..." or "Update:"
- Get straight to the point
- Maintain ALL facts: names, dates, statistics, quotes exactly
- Use concise, direct tone
- Structure for video narration
- Target length: {targetLength}
- Write in {language}

Original story: "{originalStory}"

Rewritten quick update:`,
    defaultLength: "15-30 seconds"
  }
};

export class AIStoryRewriter {
  constructor() {
    this.ai = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      this.ai = initializeAI();
      this.initialized = true;
      console.log(`✅ AI Story Rewriter initialized with ${CONFIG.aiProvider}`);
    } catch (error) {
      console.error('❌ Failed to initialize AI:', error.message);
      throw error;
    }
  }

  async rewriteStory(originalStory, options = {}) {
    if (!this.initialized) {
      throw new Error('AI Rewriter not initialized. Call initialize() first.');
    }

    const {
      style = 'breaking',
      targetLength = REWRITE_STYLES[style]?.defaultLength || '45-60 seconds',
      language = 'Spanish',
      maxRetries = 2
    } = options;

    if (!REWRITE_STYLES[style]) {
      throw new Error(`Unknown rewrite style: ${style}. Available: ${Object.keys(REWRITE_STYLES).join(', ')}`);
    }

    const prompt = REWRITE_STYLES[style].prompt
      .replace('{originalStory}', originalStory)
      .replace('{targetLength}', targetLength)
      .replace('{language}', language);

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`🤖 Rewriting story (attempt ${attempt}) with style: ${style}`);
        
        const response = await this.ai.chat.completions.create({
          model: CONFIG.aiModel,
          messages: [
            {
              role: "system",
              content: "You are an expert sports journalist and YouTube content creator. You rewrite sports news stories while maintaining 100% factual accuracy and creating engaging video scripts."
            },
            {
              role: "user", 
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7,
          top_p: 0.9
        });

        const rewrittenContent = response.choices[0]?.message?.content?.trim();
        
        if (!rewrittenContent) {
          throw new Error('Empty response from AI');
        }

        // Calculate originality score
        const originalityScore = getOriginalityScore(originalStory, rewrittenContent);
        
        const result = {
          original: originalStory,
          rewritten: rewrittenContent,
          style: style,
          targetLength: targetLength,
          language: language,
          originalityScore: originalityScore,
          wordCount: rewrittenContent.split(/\s+/).length,
          timestamp: new Date().toISOString(),
          model: CONFIG.aiModel
        };

        console.log(`✅ Rewrite complete - Originality: ${originalityScore.toFixed(1)}%, Words: ${result.wordCount}`);
        
        if (originalityScore < CONFIG.targetOriginalityScore) {
          console.warn(`⚠️ Originality score ${originalityScore.toFixed(1)}% below target ${CONFIG.targetOriginalityScore}%`);
        }

        return result;

      } catch (error) {
        lastError = error;
        console.error(`❌ Rewrite attempt ${attempt} failed:`, error.message);
        
        if (attempt <= maxRetries) {
          console.log(`🔄 Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw new Error(`Failed to rewrite after ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
  }

  async generateMultipleVersions(originalStory, options = {}) {
    const {
      styles = ['breaking', 'analysis', 'recap'],
      versions = CONFIG.rewriteVersions,
      ...rewriteOptions
    } = options;

    console.log(`🔄 Generating ${versions} versions across ${styles.length} styles...`);

    const results = [];
    const selectedStyles = styles.slice(0, versions);

    // Generate one version per style requested
    for (const style of selectedStyles) {
      try {
        const result = await this.rewriteStory(originalStory, {
          ...rewriteOptions,
          style
        });
        
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to generate ${style} version:`, error.message);
      }
    }

    // If we need more versions than styles, generate additional breaking news versions
    while (results.length < versions && results.length < 5) {
      try {
        const result = await this.rewriteStory(originalStory, {
          ...rewriteOptions,
          style: 'breaking'
        });
        
        results.push({
          ...result,
          style: `breaking-v${results.filter(r => r.style.startsWith('breaking')).length + 1}`
        });
      } catch (error) {
        console.error(`❌ Failed to generate additional version:`, error.message);
        break;
      }
    }

    console.log(`✅ Generated ${results.length} versions`);
    
    return {
      original: originalStory,
      versions: results,
      bestVersion: results.reduce((best, current) => 
        current.originalityScore > best.originalityScore ? current : best, results[0]
      ),
      averageOriginality: results.reduce((sum, r) => sum + r.originalityScore, 0) / results.length,
      timestamp: new Date().toISOString()
    };
  }

  async validateFactAccuracy(original, rewritten) {
    // Extract key facts using AI to compare original vs rewritten
    const factCheckPrompt = `Compare these two sports stories and identify any factual discrepancies:

Original: "${original}"

Rewritten: "${rewritten}"

Check for differences in:
- Names of people, teams, organizations
- Dates and times
- Numbers, statistics, scores
- Quotes (should be preserved exactly or paraphrased clearly)
- Key facts and events

Respond with "ACCURATE" if facts match, or list specific discrepancies if found.`;

    try {
      const response = await this.ai.chat.completions.create({
        model: CONFIG.aiModel,
        messages: [
          {
            role: "system",
            content: "You are a fact-checking expert. Compare sports stories for factual accuracy."
          },
          {
            role: "user",
            content: factCheckPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      });

      const result = response.choices[0]?.message?.content?.trim();
      const isAccurate = result?.toUpperCase().includes('ACCURATE');
      
      return {
        isAccurate,
        analysis: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Fact validation failed:', error.message);
      return {
        isAccurate: false,
        analysis: `Validation failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const aiRewriter = new AIStoryRewriter();
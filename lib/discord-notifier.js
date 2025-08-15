// Discord Integration - Enhanced Notifications with Rewritten Content

import { CONFIG } from './config.js';

export class DiscordNotifier {
  constructor() {
    this.webhookUrl = CONFIG.discordWebhookUrl;
    this.maxMessageLength = 2000;
  }

  async sendBreakingNewsAlert(originalStory, rewrittenVersions, flikiContent) {
    if (!this.webhookUrl) {
      console.warn('⚠️ Discord webhook URL not configured');
      return false;
    }

    try {
      const embed = this.createBreakingNewsEmbed(originalStory, rewrittenVersions, flikiContent);
      
      const payload = {
        content: "🚨 **BREAKING SPORTS NEWS DETECTED** 🚨",
        embeds: [embed],
        username: "WSC News Bot",
        avatar_url: "https://cdn.discordapp.com/attachments/news-bot-avatar.png"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('✅ Discord notification sent successfully');
        return true;
      } else {
        console.error('❌ Discord notification failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Discord notification error:', error.message);
      return false;
    }
  }

  createBreakingNewsEmbed(originalStory, rewrittenVersions, flikiContent) {
    const bestVersion = rewrittenVersions.bestVersion;
    const avgOriginality = rewrittenVersions.averageOriginality;

    const embed = {
      title: this.truncateText(originalStory.title, 256),
      url: originalStory.link,
      color: 0xFF6B6B, // Red color for breaking news
      timestamp: new Date().toISOString(),
      fields: [],
      footer: {
        text: `WSC AI Rewriter • Source: ${originalStory.source}`,
        icon_url: "https://cdn.discordapp.com/attachments/wsc-icon.png"
      }
    };

    // Original story summary
    embed.fields.push({
      name: "📰 Original Story",
      value: this.truncateText(originalStory.content, 300),
      inline: false
    });

    // Best rewritten version
    embed.fields.push({
      name: `🎬 Best Rewrite (${bestVersion.style})`,
      value: this.truncateText(bestVersion.rewritten, 400),
      inline: false
    });

    // AI Processing Stats
    embed.fields.push({
      name: "🤖 AI Processing Results",
      value: `• **Versions Generated:** ${rewrittenVersions.versions.length}
• **Average Originality:** ${avgOriginality.toFixed(1)}%
• **Best Originality:** ${bestVersion.originalityScore.toFixed(1)}%
• **Word Count:** ${bestVersion.wordCount} words
• **Style:** ${bestVersion.style}`,
      inline: true
    });

    // Key Facts (if available)
    if (originalStory.keyFacts) {
      const facts = originalStory.keyFacts;
      let factsSummary = "";
      
      if (facts.names && facts.names.length > 0) {
        factsSummary += `**Names:** ${facts.names.slice(0, 3).join(', ')}\n`;
      }
      
      if (facts.numbers && facts.numbers.length > 0) {
        factsSummary += `**Numbers:** ${facts.numbers.slice(0, 3).join(', ')}\n`;
      }
      
      if (factsSummary) {
        embed.fields.push({
          name: "🔍 Key Facts Preserved",
          value: this.truncateText(factsSummary, 200),
          inline: true
        });
      }
    }

    // Fliki-ready content preview
    if (flikiContent) {
      embed.fields.push({
        name: "🎥 Video Title",
        value: this.truncateText(flikiContent.title, 200),
        inline: false
      });

      // Add quick action buttons as description
      embed.description = `**Ready for Fliki AI Video Creation**
📋 Copy-paste ready script generated
🎯 Target: ${flikiContent.metadata.targetLength} video
🎵 Voice: ${flikiContent.flikiConfig.voice.style}
🏷️ Hashtags: ${flikiContent.social.hashtags.slice(0, 3).join(' ')}`;
    }

    return embed;
  }

  async sendProcessingUpdate(storyTitle, status, details = '') {
    if (!this.webhookUrl) return false;

    try {
      const embed = {
        title: "🔄 Story Processing Update",
        description: `**Story:** ${this.truncateText(storyTitle, 100)}
**Status:** ${status}
${details ? `**Details:** ${details}` : ''}`,
        color: 0x4ECDC4, // Teal color for updates
        timestamp: new Date().toISOString(),
        footer: {
          text: "WSC AI Rewriter"
        }
      };

      const payload = {
        embeds: [embed],
        username: "WSC News Bot"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Discord update error:', error.message);
      return false;
    }
  }

  async sendDailyStats(stats) {
    if (!this.webhookUrl) return false;

    try {
      const embed = {
        title: "📊 Daily News Monitoring Stats",
        color: 0x95E1D3, // Light green for stats
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "🔍 Monitoring Summary",
            value: `• **Total Breaking News:** ${stats.totalBreakingNews}
• **Stories Processed:** ${stats.seenStories}
• **Sources Active:** ${stats.sourceCount}
• **Last Check:** ${new Date(stats.lastCheck).toLocaleTimeString()}`,
            inline: false
          },
          {
            name: "📈 By Source",
            value: Object.entries(stats.breakingBySource)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([source, count]) => `• ${source}: ${count}`)
              .join('\n') || 'No data',
            inline: true
          },
          {
            name: "🏆 By Category", 
            value: Object.entries(stats.breakingByCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([category, count]) => `• ${category}: ${count}`)
              .join('\n') || 'No data',
            inline: true
          }
        ],
        footer: {
          text: "WSC AI Rewriter • Daily Report"
        }
      };

      const payload = {
        content: "📊 **Daily News Monitoring Report**",
        embeds: [embed],
        username: "WSC News Bot"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Discord stats error:', error.message);
      return false;
    }
  }

  async sendErrorAlert(error, context = '') {
    if (!this.webhookUrl) return false;

    try {
      const embed = {
        title: "🚨 System Error Alert",
        description: `**Error:** ${error.message}
${context ? `**Context:** ${context}` : ''}
**Time:** ${new Date().toLocaleString()}`,
        color: 0xFF4757, // Red for errors
        timestamp: new Date().toISOString(),
        footer: {
          text: "WSC AI Rewriter • Error Alert"
        }
      };

      const payload = {
        content: "@here 🚨 **System Alert**",
        embeds: [embed],
        username: "WSC News Bot"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (discordError) {
      console.error('❌ Discord error alert failed:', discordError.message);
      return false;
    }
  }

  async sendRewriteComparison(original, versions) {
    if (!this.webhookUrl) return false;

    try {
      const embeds = [];
      
      // Main comparison embed
      const mainEmbed = {
        title: "📝 Story Rewrite Comparison",
        description: `Generated ${versions.length} versions for analysis`,
        color: 0x3742FA, // Blue for comparison
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "📰 Original",
            value: this.truncateText(original, 300),
            inline: false
          }
        ]
      };

      // Add each version as a field
      versions.slice(0, 3).forEach((version, index) => {
        mainEmbed.fields.push({
          name: `🎬 Version ${index + 1}: ${version.style} (${version.originalityScore.toFixed(1)}% original)`,
          value: this.truncateText(version.rewritten, 250),
          inline: false
        });
      });

      embeds.push(mainEmbed);

      const payload = {
        content: "📝 **A/B Testing Ready - Multiple Versions Generated**",
        embeds: embeds,
        username: "WSC News Bot"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Discord comparison error:', error.message);
      return false;
    }
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
  }

  formatFlikiScript(flikiContent) {
    const { script, title, social } = flikiContent;
    
    return `**🎥 ${title}**

**📝 SCRIPT:**
**Hook (0-3s):** ${script.hook.text}
**Main (3-${script.timing?.sections[1]?.end || '45s'}):** ${script.mainContent.text}
**CTA (${script.timing?.sections[2]?.start || '45s'}-end):** ${script.cta.text}

**🏷️ Hashtags:** ${social.hashtags.join(' ')}
**📱 Twitter:** ${this.truncateText(social.twitter, 200)}`;
  }

  async sendFlikiReadyContent(flikiContent) {
    if (!this.webhookUrl) return false;

    try {
      const embed = {
        title: "🎬 Fliki-Ready Video Script",
        description: this.formatFlikiScript(flikiContent),
        color: 0x5F27CD, // Purple for Fliki content
        timestamp: new Date().toISOString(),
        fields: [
          {
            name: "🎵 Audio Settings",
            value: `• **Voice:** ${flikiContent.flikiConfig.voice.style}
• **Language:** ${flikiContent.flikiConfig.voice.language}
• **Speed:** ${flikiContent.flikiConfig.voice.speed}x
• **Pitch:** ${flikiContent.flikiConfig.voice.pitch}x`,
            inline: true
          },
          {
            name: "📊 Visual Cues",
            value: flikiContent.script.visualCues
              ? flikiContent.script.visualCues.slice(0, 3)
                  .map(cue => `• ${cue.time}: ${cue.visual}`)
                  .join('\n')
              : 'Auto-generated based on content',
            inline: true
          }
        ],
        footer: {
          text: "Copy-paste ready for Fliki AI • WSC News Bot"
        }
      };

      const payload = {
        content: "🎬 **FLIKI-READY CONTENT** - Copy & Paste into Fliki AI",
        embeds: [embed],
        username: "WSC News Bot"
      };

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Discord Fliki content error:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const discordNotifier = new DiscordNotifier();
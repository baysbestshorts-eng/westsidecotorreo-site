#!/usr/bin/env node

/**
 * Cost Monitoring Script
 * Tracks daily spending across all APIs and services
 * Automatically pauses workflows when budget limits are exceeded
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const CONFIG = {
  budgets: {
    daily: parseFloat(process.env.DAILY_BUDGET_LIMIT) || 100.00,
    weekly: parseFloat(process.env.WEEKLY_BUDGET_LIMIT) || 500.00,
    monthly: parseFloat(process.env.MONTHLY_BUDGET_LIMIT) || 2000.00
  },
  costs: {
    apiRequest: parseFloat(process.env.COST_PER_API_REQUEST) || 0.001,
    openaiToken: parseFloat(process.env.COST_PER_OPENAI_TOKEN) || 0.00002,
    flikiVideo: parseFloat(process.env.COST_PER_FLIKI_VIDEO) || 1.50,
    youtubeUpload: parseFloat(process.env.COST_PER_YOUTUBE_UPLOAD) || 0.00
  },
  webhooks: {
    pause: process.env.MAKE_WEBHOOK_PAUSE_ALL,
    resume: process.env.MAKE_WEBHOOK_RESUME_ALL,
    alert: process.env.MAKE_WEBHOOK_COST_ALERT
  }
};

const COST_LOG_FILE = path.join(process.cwd(), 'logs', 'daily-costs.json');
const USAGE_LOG_FILE = path.join(process.cwd(), 'logs', 'api-usage.json');

class CostMonitor {
  constructor() {
    this.dailySpend = 0;
    this.weeklySpend = 0;
    this.monthlySpend = 0;
    this.usage = {
      apiRequests: 0,
      openaiTokens: 0,
      flikiVideos: 0,
      youtubeUploads: 0
    };
  }

  async loadExistingData() {
    try {
      // Ensure logs directory exists
      await fs.mkdir(path.dirname(COST_LOG_FILE), { recursive: true });
      
      // Load cost data
      try {
        const costData = await fs.readFile(COST_LOG_FILE, 'utf8');
        const costs = JSON.parse(costData);
        this.dailySpend = costs.daily || 0;
        this.weeklySpend = costs.weekly || 0;
        this.monthlySpend = costs.monthly || 0;
      } catch (e) {
        console.log('No existing cost data found, starting fresh');
      }

      // Load usage data
      try {
        const usageData = await fs.readFile(USAGE_LOG_FILE, 'utf8');
        this.usage = { ...this.usage, ...JSON.parse(usageData) };
      } catch (e) {
        console.log('No existing usage data found, starting fresh');
      }
    } catch (error) {
      console.error('Error loading existing data:', error);
    }
  }

  async recordUsage(type, amount = 1) {
    const validTypes = ['apiRequests', 'openaiTokens', 'flikiVideos', 'youtubeUploads'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid usage type: ${type}`);
    }

    this.usage[type] += amount;
    
    // Calculate cost based on usage type
    let cost = 0;
    switch (type) {
      case 'apiRequests':
        cost = amount * CONFIG.costs.apiRequest;
        break;
      case 'openaiTokens':
        cost = amount * CONFIG.costs.openaiToken;
        break;
      case 'flikiVideos':
        cost = amount * CONFIG.costs.flikiVideo;
        break;
      case 'youtubeUploads':
        cost = amount * CONFIG.costs.youtubeUpload;
        break;
    }

    await this.addCost(cost, type);
  }

  async addCost(amount, source = 'unknown') {
    this.dailySpend += amount;
    this.weeklySpend += amount;
    this.monthlySpend += amount;

    console.log(`💰 Added $${amount.toFixed(4)} from ${source}. Daily total: $${this.dailySpend.toFixed(2)}`);

    await this.saveCostData();
    await this.checkBudgetLimits();
  }

  async checkBudgetLimits() {
    const alerts = [];

    // Check daily budget
    if (this.dailySpend >= CONFIG.budgets.daily) {
      alerts.push({
        level: 'CRITICAL',
        type: 'DAILY_BUDGET_EXCEEDED',
        current: this.dailySpend,
        limit: CONFIG.budgets.daily,
        action: 'PAUSE_ALL_WORKFLOWS'
      });
    } else if (this.dailySpend >= CONFIG.budgets.daily * 0.8) {
      alerts.push({
        level: 'WARNING',
        type: 'DAILY_BUDGET_80_PERCENT',
        current: this.dailySpend,
        limit: CONFIG.budgets.daily,
        action: 'SEND_ALERT'
      });
    }

    // Check weekly budget
    if (this.weeklySpend >= CONFIG.budgets.weekly) {
      alerts.push({
        level: 'CRITICAL',
        type: 'WEEKLY_BUDGET_EXCEEDED',
        current: this.weeklySpend,
        limit: CONFIG.budgets.weekly,
        action: 'PAUSE_ALL_WORKFLOWS'
      });
    }

    // Check monthly budget
    if (this.monthlySpend >= CONFIG.budgets.monthly) {
      alerts.push({
        level: 'CRITICAL',
        type: 'MONTHLY_BUDGET_EXCEEDED',
        current: this.monthlySpend,
        limit: CONFIG.budgets.monthly,
        action: 'PAUSE_ALL_WORKFLOWS'
      });
    }

    for (const alert of alerts) {
      await this.handleAlert(alert);
    }
  }

  async handleAlert(alert) {
    console.log(`🚨 BUDGET ALERT: ${alert.type}`);
    console.log(`Current: $${alert.current.toFixed(2)}, Limit: $${alert.limit.toFixed(2)}`);

    if (alert.action === 'PAUSE_ALL_WORKFLOWS') {
      await this.pauseAllWorkflows();
      await this.sendCriticalAlert(alert);
    } else if (alert.action === 'SEND_ALERT') {
      await this.sendWarningAlert(alert);
    }
  }

  async pauseAllWorkflows() {
    if (!CONFIG.webhooks.pause) {
      console.error('⚠️ No pause webhook configured!');
      return;
    }

    try {
      const response = await fetch(CONFIG.webhooks.pause, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause_all',
          reason: 'budget_exceeded',
          timestamp: new Date().toISOString(),
          current_spend: {
            daily: this.dailySpend,
            weekly: this.weeklySpend,
            monthly: this.monthlySpend
          }
        })
      });

      if (response.ok) {
        console.log('✅ All workflows paused successfully');
      } else {
        console.error('❌ Failed to pause workflows:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error pausing workflows:', error);
    }
  }

  async resumeWorkflows() {
    if (!CONFIG.webhooks.resume) {
      console.error('⚠️ No resume webhook configured!');
      return;
    }

    try {
      const response = await fetch(CONFIG.webhooks.resume, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume_all',
          timestamp: new Date().toISOString(),
          current_spend: {
            daily: this.dailySpend,
            weekly: this.weeklySpend,
            monthly: this.monthlySpend
          }
        })
      });

      if (response.ok) {
        console.log('✅ All workflows resumed successfully');
      } else {
        console.error('❌ Failed to resume workflows:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error resuming workflows:', error);
    }
  }

  async sendCriticalAlert(alert) {
    const message = {
      level: 'CRITICAL',
      title: 'Budget Limit Exceeded - Workflows Paused',
      message: `${alert.type}: Current spend $${alert.current.toFixed(2)} exceeds limit $${alert.limit.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      action_taken: 'All workflows have been automatically paused',
      budget_status: {
        daily: { current: this.dailySpend, limit: CONFIG.budgets.daily },
        weekly: { current: this.weeklySpend, limit: CONFIG.budgets.weekly },
        monthly: { current: this.monthlySpend, limit: CONFIG.budgets.monthly }
      }
    };

    await this.sendAlert(message);
  }

  async sendWarningAlert(alert) {
    const message = {
      level: 'WARNING',
      title: 'Budget Warning - 80% Limit Reached',
      message: `${alert.type}: Current spend $${alert.current.toFixed(2)} is 80% of limit $${alert.limit.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      action_taken: 'No action taken, monitoring continues',
      budget_status: {
        daily: { current: this.dailySpend, limit: CONFIG.budgets.daily },
        weekly: { current: this.weeklySpend, limit: CONFIG.budgets.weekly },
        monthly: { current: this.monthlySpend, limit: CONFIG.budgets.monthly }
      }
    };

    await this.sendAlert(message);
  }

  async sendAlert(message) {
    if (CONFIG.webhooks.alert) {
      try {
        await fetch(CONFIG.webhooks.alert, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message)
        });
        console.log('📧 Alert sent successfully');
      } catch (error) {
        console.error('❌ Failed to send alert:', error);
      }
    }

    // Also log to console for immediate visibility
    console.log('🔔 ALERT:', JSON.stringify(message, null, 2));
  }

  async saveCostData() {
    const data = {
      daily: this.dailySpend,
      weekly: this.weeklySpend,
      monthly: this.monthlySpend,
      lastUpdated: new Date().toISOString()
    };

    try {
      await fs.writeFile(COST_LOG_FILE, JSON.stringify(data, null, 2));
      await fs.writeFile(USAGE_LOG_FILE, JSON.stringify(this.usage, null, 2));
    } catch (error) {
      console.error('Error saving cost data:', error);
    }
  }

  async resetDailyCounters() {
    this.dailySpend = 0;
    this.usage = {
      apiRequests: 0,
      openaiTokens: 0,
      flikiVideos: 0,
      youtubeUploads: 0
    };
    await this.saveCostData();
    console.log('🔄 Daily counters reset');
  }

  async resetWeeklyCounters() {
    this.weeklySpend = 0;
    await this.saveCostData();
    console.log('🔄 Weekly counters reset');
  }

  async resetMonthlyCounters() {
    this.monthlySpend = 0;
    await this.saveCostData();
    console.log('🔄 Monthly counters reset');
  }

  getStatus() {
    return {
      spending: {
        daily: { current: this.dailySpend, limit: CONFIG.budgets.daily, percentage: (this.dailySpend / CONFIG.budgets.daily * 100).toFixed(1) },
        weekly: { current: this.weeklySpend, limit: CONFIG.budgets.weekly, percentage: (this.weeklySpend / CONFIG.budgets.weekly * 100).toFixed(1) },
        monthly: { current: this.monthlySpend, limit: CONFIG.budgets.monthly, percentage: (this.monthlySpend / CONFIG.budgets.monthly * 100).toFixed(1) }
      },
      usage: this.usage,
      budgetHealth: this.dailySpend < CONFIG.budgets.daily * 0.8 ? 'HEALTHY' : 
                    this.dailySpend < CONFIG.budgets.daily ? 'WARNING' : 'CRITICAL'
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CostMonitor();
  await monitor.loadExistingData();

  const command = process.argv[2];
  const amount = parseFloat(process.argv[3]) || 1;

  switch (command) {
    case 'status':
      console.log(JSON.stringify(monitor.getStatus(), null, 2));
      break;
    
    case 'add-api-usage':
      await monitor.recordUsage('apiRequests', amount);
      break;
    
    case 'add-openai-tokens':
      await monitor.recordUsage('openaiTokens', amount);
      break;
    
    case 'add-fliki-video':
      await monitor.recordUsage('flikiVideos', amount);
      break;
    
    case 'add-youtube-upload':
      await monitor.recordUsage('youtubeUploads', amount);
      break;
    
    case 'add-cost':
      await monitor.addCost(amount, 'manual');
      break;
    
    case 'reset-daily':
      await monitor.resetDailyCounters();
      break;
    
    case 'reset-weekly':
      await monitor.resetWeeklyCounters();
      break;
    
    case 'reset-monthly':
      await monitor.resetMonthlyCounters();
      break;
    
    case 'pause':
      await monitor.pauseAllWorkflows();
      break;
    
    case 'resume':
      await monitor.resumeWorkflows();
      break;
    
    default:
      console.log(`
Usage: node cost-monitor.js <command> [amount]

Commands:
  status                    - Show current budget status
  add-api-usage [count]     - Record API requests (default: 1)
  add-openai-tokens [count] - Record OpenAI token usage
  add-fliki-video [count]   - Record Fliki video generation
  add-youtube-upload [count]- Record YouTube upload
  add-cost [amount]         - Add manual cost entry
  reset-daily               - Reset daily counters
  reset-weekly              - Reset weekly counters  
  reset-monthly             - Reset monthly counters
  pause                     - Pause all workflows
  resume                    - Resume all workflows

Examples:
  node cost-monitor.js status
  node cost-monitor.js add-api-usage 50
  node cost-monitor.js add-fliki-video 1
  node cost-monitor.js add-cost 15.50
      `);
  }
}

export default CostMonitor;
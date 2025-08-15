#!/usr/bin/env node

/**
 * Error Handling and Retry Logic System
 * Handles API failures, video generation errors, and system recovery
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const ERROR_LOG_FILE = path.join(process.cwd(), 'logs', 'error-log.json');
const RETRY_QUEUE_FILE = path.join(process.cwd(), 'logs', 'retry-queue.json');

class ErrorHandler {
  constructor() {
    this.maxRetries = parseInt(process.env.MAX_RETRY_ATTEMPTS) || 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
    this.errorLog = [];
    this.retryQueue = [];
  }

  async init() {
    await this.loadErrorLog();
    await this.loadRetryQueue();
  }

  async loadErrorLog() {
    try {
      await fs.mkdir(path.dirname(ERROR_LOG_FILE), { recursive: true });
      const data = await fs.readFile(ERROR_LOG_FILE, 'utf8');
      this.errorLog = JSON.parse(data);
    } catch (error) {
      this.errorLog = [];
    }
  }

  async loadRetryQueue() {
    try {
      const data = await fs.readFile(RETRY_QUEUE_FILE, 'utf8');
      this.retryQueue = JSON.parse(data);
    } catch (error) {
      this.retryQueue = [];
    }
  }

  async saveErrorLog() {
    await fs.writeFile(ERROR_LOG_FILE, JSON.stringify(this.errorLog, null, 2));
  }

  async saveRetryQueue() {
    await fs.writeFile(RETRY_QUEUE_FILE, JSON.stringify(this.retryQueue, null, 2));
  }

  async logError(error, context = {}) {
    const errorEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      context: context,
      severity: this.determineSeverity(error, context),
      resolved: false
    };

    this.errorLog.push(errorEntry);
    await this.saveErrorLog();

    console.error(`🚨 Error logged [${errorEntry.id}]:`, error.message);
    
    // Determine if this should be retried
    if (this.shouldRetry(error, context)) {
      await this.addToRetryQueue(errorEntry);
    }

    // Send alerts for critical errors
    if (errorEntry.severity === 'critical') {
      await this.sendCriticalAlert(errorEntry);
    }

    return errorEntry.id;
  }

  determineSeverity(error, context) {
    // Network/API errors - usually retryable
    if (error.message.includes('ECONNRESET') || 
        error.message.includes('timeout') ||
        error.message.includes('rate limit')) {
      return 'medium';
    }

    // Authentication errors - critical, need immediate attention
    if (error.message.includes('401') || 
        error.message.includes('403') ||
        error.message.includes('unauthorized')) {
      return 'critical';
    }

    // Budget/quota errors - critical
    if (error.message.includes('quota') || 
        error.message.includes('budget') ||
        context.type === 'budget_exceeded') {
      return 'critical';
    }

    // Video generation failures - high priority
    if (context.operation === 'video_generation' ||
        context.operation === 'fliki_api') {
      return 'high';
    }

    // Content processing errors - medium
    if (context.operation === 'content_processing' ||
        context.operation === 'openai_api') {
      return 'medium';
    }

    // Default to low for unknown errors
    return 'low';
  }

  shouldRetry(error, context) {
    // Don't retry authentication errors
    if (error.message.includes('401') || error.message.includes('403')) {
      return false;
    }

    // Don't retry budget exceeded errors
    if (context.type === 'budget_exceeded') {
      return false;
    }

    // Don't retry malformed requests
    if (error.message.includes('400') || error.message.includes('422')) {
      return false;
    }

    // Retry network errors, timeouts, rate limits
    return true;
  }

  async addToRetryQueue(errorEntry) {
    const retryItem = {
      id: this.generateId(),
      errorId: errorEntry.id,
      operation: errorEntry.context.operation,
      data: errorEntry.context.data,
      attempts: 0,
      maxAttempts: this.maxRetries,
      nextRetry: new Date(Date.now() + this.retryDelays[0]),
      createdAt: new Date().toISOString()
    };

    this.retryQueue.push(retryItem);
    await this.saveRetryQueue();

    console.log(`🔄 Added to retry queue [${retryItem.id}]: ${errorEntry.context.operation}`);
  }

  async processRetryQueue() {
    const now = new Date();
    const pendingRetries = this.retryQueue.filter(item => 
      item.attempts < item.maxAttempts && 
      new Date(item.nextRetry) <= now
    );

    for (const retry of pendingRetries) {
      await this.processRetry(retry);
    }

    // Clean up completed or failed retries
    this.retryQueue = this.retryQueue.filter(item => 
      item.attempts < item.maxAttempts
    );
    
    await this.saveRetryQueue();
  }

  async processRetry(retryItem) {
    console.log(`🔄 Processing retry [${retryItem.id}] attempt ${retryItem.attempts + 1}/${retryItem.maxAttempts}`);

    try {
      const success = await this.executeRetry(retryItem);
      
      if (success) {
        console.log(`✅ Retry successful [${retryItem.id}]`);
        retryItem.attempts = retryItem.maxAttempts; // Mark as complete
        await this.markErrorResolved(retryItem.errorId);
      } else {
        throw new Error('Retry operation returned false');
      }
    } catch (error) {
      console.error(`❌ Retry failed [${retryItem.id}]:`, error.message);
      
      retryItem.attempts++;
      
      if (retryItem.attempts < retryItem.maxAttempts) {
        // Schedule next retry with exponential backoff
        const delay = this.retryDelays[Math.min(retryItem.attempts - 1, this.retryDelays.length - 1)];
        retryItem.nextRetry = new Date(Date.now() + delay);
        console.log(`⏰ Next retry scheduled for ${retryItem.nextRetry}`);
      } else {
        console.error(`💀 Max retries exceeded [${retryItem.id}]`);
        await this.handleMaxRetriesExceeded(retryItem);
      }
    }
  }

  async executeRetry(retryItem) {
    switch (retryItem.operation) {
      case 'sports_api_fetch':
        return await this.retrySportsApiFetch(retryItem.data);
      
      case 'content_generation':
        return await this.retryContentGeneration(retryItem.data);
      
      case 'video_generation':
        return await this.retryVideoGeneration(retryItem.data);
      
      case 'youtube_upload':
        return await this.retryYouTubeUpload(retryItem.data);
      
      default:
        console.warn(`Unknown retry operation: ${retryItem.operation}`);
        return false;
    }
  }

  async retrySportsApiFetch(data) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(data.url, {
        headers: data.headers,
        timeout: 30000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Trigger webhook to continue processing
      if (process.env.MAKE_WEBHOOK_DATA_COLLECTION) {
        await fetch(process.env.MAKE_WEBHOOK_DATA_COLLECTION, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(await response.json())
        });
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async retryContentGeneration(data) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.payload)
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Trigger next step in workflow
      if (process.env.MAKE_WEBHOOK_CONTENT_PROCESSING) {
        await fetch(process.env.MAKE_WEBHOOK_CONTENT_PROCESSING, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, generatedContent: result })
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async retryVideoGeneration(data) {
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch('https://api.fliki.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FLIKI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.payload)
      });

      if (!response.ok) {
        throw new Error(`Fliki API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Monitor video generation status
      setTimeout(async () => {
        await this.monitorVideoGeneration(result.job_id, data);
      }, 30000);

      return true;
    } catch (error) {
      return false;
    }
  }

  async retryYouTubeUpload(data) {
    try {
      const { google } = await import('googleapis');
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
      });

      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
      
      const response = await youtube.videos.insert({
        part: 'snippet,status',
        requestBody: data.metadata,
        media: {
          body: data.videoStream
        }
      });

      return response.data.id ? true : false;
    } catch (error) {
      return false;
    }
  }

  async markErrorResolved(errorId) {
    const errorIndex = this.errorLog.findIndex(e => e.id === errorId);
    if (errorIndex !== -1) {
      this.errorLog[errorIndex].resolved = true;
      this.errorLog[errorIndex].resolvedAt = new Date().toISOString();
      await this.saveErrorLog();
    }
  }

  async handleMaxRetriesExceeded(retryItem) {
    const alertData = {
      type: 'max_retries_exceeded',
      retryId: retryItem.id,
      operation: retryItem.operation,
      attempts: retryItem.attempts,
      originalError: retryItem.errorId,
      timestamp: new Date().toISOString()
    };

    // Send alert to administrators
    await this.sendCriticalAlert(alertData);
    
    // Log as unresolved critical error
    await this.logError(new Error(`Max retries exceeded for ${retryItem.operation}`), {
      type: 'max_retries_exceeded',
      retryItem: retryItem
    });
  }

  async sendCriticalAlert(errorData) {
    if (process.env.MAKE_WEBHOOK_COST_ALERT) {
      try {
        const fetch = (await import('node-fetch')).default;
        await fetch(process.env.MAKE_WEBHOOK_COST_ALERT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'critical_error',
            data: errorData,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to send critical alert:', error);
      }
    }
  }

  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      resolved: this.errorLog.filter(e => e.resolved).length,
      pending: this.retryQueue.length,
      severity: {
        critical: this.errorLog.filter(e => e.severity === 'critical' && !e.resolved).length,
        high: this.errorLog.filter(e => e.severity === 'high' && !e.resolved).length,
        medium: this.errorLog.filter(e => e.severity === 'medium' && !e.resolved).length,
        low: this.errorLog.filter(e => e.severity === 'low' && !e.resolved).length
      }
    };

    return stats;
  }
}

export default ErrorHandler;

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const handler = new ErrorHandler();
  await handler.init();

  const command = process.argv[2];

  switch (command) {
    case 'process-retries':
      await handler.processRetryQueue();
      break;
    
    case 'stats':
      console.log(JSON.stringify(handler.getErrorStats(), null, 2));
      break;
    
    case 'clear-resolved':
      handler.errorLog = handler.errorLog.filter(e => !e.resolved);
      await handler.saveErrorLog();
      console.log('Cleared resolved errors from log');
      break;
    
    default:
      console.log(`
Usage: node error-handler.js <command>

Commands:
  process-retries  - Process pending retry queue
  stats           - Show error statistics
  clear-resolved  - Remove resolved errors from log

This script is also imported as a module by other components.
      `);
  }
}
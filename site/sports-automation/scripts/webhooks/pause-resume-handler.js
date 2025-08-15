#!/usr/bin/env node

/**
 * Webhook Handler for Pause/Resume Operations
 * Receives webhooks from Make.com to control workflow execution
 */

import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3000;
const SECRET_KEY = process.env.WEBHOOK_SECRET_KEY || 'your-secret-key-here';

app.use(express.json());

// State file to track current workflow status
const STATE_FILE = path.join(process.cwd(), 'logs', 'workflow-state.json');

class WorkflowController {
  constructor() {
    this.state = {
      isActive: true,
      pauseReason: null,
      pausedAt: null,
      resumedAt: null,
      pauseCount: 0,
      resumeCount: 0
    };
    this.makeScenarios = {
      dataCollection: process.env.MAKE_SCENARIO_ID_DATA_COLLECTION,
      contentProcessing: process.env.MAKE_SCENARIO_ID_CONTENT_PROCESSING,
      videoGeneration: process.env.MAKE_SCENARIO_ID_VIDEO_GENERATION,
      publishing: process.env.MAKE_SCENARIO_ID_PUBLISHING,
      monitoring: process.env.MAKE_SCENARIO_ID_MONITORING
    };
  }

  async loadState() {
    try {
      await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
      const stateData = await fs.readFile(STATE_FILE, 'utf8');
      this.state = { ...this.state, ...JSON.parse(stateData) };
    } catch (error) {
      console.log('No existing state found, using defaults');
    }
  }

  async saveState() {
    try {
      await fs.writeFile(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  async pauseScenario(scenarioId, reason = 'manual') {
    if (!scenarioId) {
      throw new Error('Scenario ID is required');
    }

    try {
      const response = await fetch(`https://us1.make.com/api/v2/scenarios/${scenarioId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to pause scenario ${scenarioId}: ${response.statusText}`);
      }

      console.log(`✅ Paused scenario: ${scenarioId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to pause scenario ${scenarioId}:`, error);
      return false;
    }
  }

  async resumeScenario(scenarioId) {
    if (!scenarioId) {
      throw new Error('Scenario ID is required');
    }

    try {
      const response = await fetch(`https://us1.make.com/api/v2/scenarios/${scenarioId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${process.env.MAKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to resume scenario ${scenarioId}: ${response.statusText}`);
      }

      console.log(`✅ Resumed scenario: ${scenarioId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to resume scenario ${scenarioId}:`, error);
      return false;
    }
  }

  async pauseAllWorkflows(reason = 'manual', excludeMonitoring = true) {
    console.log(`🛑 Pausing all workflows. Reason: ${reason}`);
    
    const results = {};
    const scenariosToProcess = Object.entries(this.makeScenarios);

    for (const [name, scenarioId] of scenariosToProcess) {
      // Don't pause monitoring scenario unless explicitly requested
      if (excludeMonitoring && name === 'monitoring') {
        console.log(`⏭️ Skipping monitoring scenario`);
        results[name] = { success: true, skipped: true };
        continue;
      }

      if (scenarioId) {
        results[name] = { success: await this.pauseScenario(scenarioId, reason) };
      } else {
        console.warn(`⚠️ No scenario ID configured for ${name}`);
        results[name] = { success: false, error: 'No scenario ID configured' };
      }
    }

    // Update state
    this.state.isActive = false;
    this.state.pauseReason = reason;
    this.state.pausedAt = new Date().toISOString();
    this.state.pauseCount++;
    await this.saveState();

    return results;
  }

  async resumeAllWorkflows() {
    console.log(`▶️ Resuming all workflows`);
    
    const results = {};
    const scenariosToProcess = Object.entries(this.makeScenarios);

    for (const [name, scenarioId] of scenariosToProcess) {
      if (scenarioId) {
        results[name] = { success: await this.resumeScenario(scenarioId) };
      } else {
        console.warn(`⚠️ No scenario ID configured for ${name}`);
        results[name] = { success: false, error: 'No scenario ID configured' };
      }
    }

    // Update state
    this.state.isActive = true;
    this.state.pauseReason = null;
    this.state.resumedAt = new Date().toISOString();
    this.state.resumeCount++;
    await this.saveState();

    return results;
  }

  async getWorkflowStatus() {
    const status = {};
    
    for (const [name, scenarioId] of Object.entries(this.makeScenarios)) {
      if (!scenarioId) {
        status[name] = { configured: false };
        continue;
      }

      try {
        const response = await fetch(`https://us1.make.com/api/v2/scenarios/${scenarioId}`, {
          headers: {
            'Authorization': `Token ${process.env.MAKE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          status[name] = {
            configured: true,
            isActive: data.scheduling?.type === 'interval',
            lastRun: data.lastRun,
            state: data.state
          };
        } else {
          status[name] = { configured: true, error: 'Failed to fetch status' };
        }
      } catch (error) {
        status[name] = { configured: true, error: error.message };
      }
    }

    return {
      overall: this.state,
      scenarios: status
    };
  }
}

// Initialize controller
const controller = new WorkflowController();
await controller.loadState();

// Middleware to verify webhook secret
const verifySecret = (req, res, next) => {
  const receivedSecret = req.headers['x-webhook-secret'] || req.body.secret;
  
  if (receivedSecret !== SECRET_KEY) {
    return res.status(401).json({ error: 'Invalid webhook secret' });
  }
  
  next();
};

// Routes
app.post('/webhook/pause', verifySecret, async (req, res) => {
  try {
    const { reason = 'webhook_triggered', exclude_monitoring = true } = req.body;
    
    const results = await controller.pauseAllWorkflows(reason, exclude_monitoring);
    
    res.json({
      success: true,
      message: 'Pause command executed',
      results,
      timestamp: new Date().toISOString()
    });

    console.log('📨 Pause webhook executed successfully');
  } catch (error) {
    console.error('❌ Pause webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/webhook/resume', verifySecret, async (req, res) => {
  try {
    const results = await controller.resumeAllWorkflows();
    
    res.json({
      success: true,
      message: 'Resume command executed',
      results,
      timestamp: new Date().toISOString()
    });

    console.log('📨 Resume webhook executed successfully');
  } catch (error) {
    console.error('❌ Resume webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/webhook/budget-alert', verifySecret, async (req, res) => {
  try {
    const { level, type, current, limit, action } = req.body;
    
    console.log(`💰 Budget alert received: ${type} - ${level}`);
    console.log(`Current spend: $${current}, Limit: $${limit}`);

    // If it's a critical alert, automatically pause workflows
    if (level === 'CRITICAL' && action === 'PAUSE_ALL_WORKFLOWS') {
      const results = await controller.pauseAllWorkflows(`budget_exceeded_${type.toLowerCase()}`, true);
      
      res.json({
        success: true,
        message: 'Budget alert processed - workflows paused',
        action_taken: 'pause_all_workflows',
        results,
        timestamp: new Date().toISOString()
      });
    } else {
      // Just log the warning
      res.json({
        success: true,
        message: 'Budget alert processed - warning logged',
        action_taken: 'log_warning',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('❌ Budget alert webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/status', async (req, res) => {
  try {
    const status = await controller.getWorkflowStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Webhook handler error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook handler listening on port ${PORT}`);
  console.log(`📋 Current workflow state: ${controller.state.isActive ? 'ACTIVE' : 'PAUSED'}`);
  if (!controller.state.isActive) {
    console.log(`⏸️ Paused reason: ${controller.state.pauseReason}`);
    console.log(`⏰ Paused at: ${controller.state.pausedAt}`);
  }
});

export { controller };
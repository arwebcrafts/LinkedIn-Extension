/**
 * BACKGROUND SERVICE WORKER
 * Coordinates automation, scheduling, and backend communication
 */

import { StorageManager } from '../core/storage-manager';
import { CooldownManager } from '../core/warmup-protocol';
import AIService from '../core/ai-service';
import { getOpenAIKey, isOpenAIConfigured } from '../config/config';

class BackgroundService {
  private readonly BACKEND_API_URL = 'https://api.kommentify.com'; // Replace with actual backend URL
  private dailyResetAlarm = 'daily-reset';
  private healthCheckAlarm = 'health-check';
  private aiService: AIService | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize background service
   */
  private async init(): Promise<void> {
    console.log('Kommentify: Background service starting...');

    // Initialize storage
    await StorageManager.initialize();

    // Initialize AI service
    await this.initializeAI();

    // Set up alarms
    this.setupAlarms();

    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async
    });

    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Monitor network requests for error detection
    this.setupNetworkMonitoring();

    console.log('Kommentify: Background service initialized');
  }

  /**
   * Handle messages from content script or popup
   */
  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void): Promise<void> {
    try {
      switch (message.type) {
        case 'GENERATE_COMMENT':
          const comment = await this.generateAIComment(message.post);
          sendResponse({ comment });
          break;

        case 'GENERATE_POST':
          const post = await this.generateAIPost(
            message.topic,
            message.goal,
            message.targetAudience
          );
          sendResponse({ post });
          break;

        case 'CONFIGURE_OPENAI':
          await this.initializeAI();
          sendResponse({ success: true });
          break;

        case 'VERIFY_LICENSE':
          const licenseValid = await this.verifyLicense(message.licenseKey);
          sendResponse({ valid: licenseValid });
          break;

        case 'REPORT_ACTION':
          await this.reportActionToBackend(message.action);
          sendResponse({ success: true });
          break;

        case 'REPORT_WARNING':
          await this.reportWarningToBackend(message.signals);
          sendResponse({ success: true });
          break;

        case 'GET_STATS':
          const stats = await StorageManager.getStatistics();
          sendResponse({ stats });
          break;

        case 'STOP_AUTOMATION':
          await StorageManager.setAutomationEnabled(false);
          sendResponse({ success: true });
          break;

        case 'SHOW_EMERGENCY_MODAL':
          await this.showEmergencyNotification(message.signals);
          sendResponse({ success: true });
          break;

        case 'SHOW_WARNING':
          await this.showWarningNotification(message.signals);
          sendResponse({ success: true });
          break;

        case 'SHOW_INFO':
          await this.showInfoNotification(message.message);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: (error as Error).message });
    }
  }

  /**
   * Initialize AI service with API key
   */
  private async initializeAI(): Promise<void> {
    try {
      const apiKey = await getOpenAIKey();
      if (apiKey) {
        this.aiService = new AIService(apiKey);
        console.log('✅ AI Service initialized');
      } else {
        console.warn('⚠️ No OpenAI API key configured. AI features disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  /**
   * Setup periodic alarms
   */
  private setupAlarms(): void {
    // Daily reset at midnight
    chrome.alarms.create(this.dailyResetAlarm, {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60, // Every 24 hours
    });

    // Health check every 5 minutes
    chrome.alarms.create(this.healthCheckAlarm, {
      periodInMinutes: 5,
    });
  }

  /**
   * Handle alarm events
   */
  private async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === this.dailyResetAlarm) {
      await this.performDailyReset();
    } else if (alarm.name === this.healthCheckAlarm) {
      await this.performHealthCheck();
    }
  }

  /**
   * Daily reset of counters
   */
  private async performDailyReset(): Promise<void> {
    console.log('Performing daily reset...');

    await StorageManager.resetDailyCounters();

    // Sync with backend
    await this.syncWithBackend();

    console.log('Daily reset complete');
  }

  /**
   * Health check - verify extension is functioning properly
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check if in cooldown
      const cooldown = await CooldownManager.isInCooldown();
      if (cooldown.inCooldown) {
        // Ensure automation is disabled
        await StorageManager.setAutomationEnabled(false);
        return;
      }

      // Check license validity
      const data = await chrome.storage.local.get(['licenseKey', 'licenseValid', 'licenseExpiry']);
      if (data.licenseKey && data.licenseExpiry) {
        if (Date.now() > data.licenseExpiry) {
          // License expired
          await chrome.storage.local.set({ licenseValid: false });
          await StorageManager.setAutomationEnabled(false);
          this.showNotification('License Expired', 'Your Kommentify license has expired. Please renew to continue.');
        }
      }

      // Ping backend
      const isOnline = await this.checkBackendHealth();
      if (!isOnline) {
        console.warn('Backend is offline');
      }

    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  /**
   * Setup network request monitoring
   */
  private setupNetworkMonitoring(): void {
    // Monitor LinkedIn API calls for rate limiting
    chrome.webRequest.onCompleted.addListener(
      (details) => {
        if (details.statusCode === 429 || details.statusCode === 403) {
          // Rate limited or forbidden
          this.handleRateLimitDetection(details);
        }
      },
      { urls: ['https://*.linkedin.com/*'] }
    );

    chrome.webRequest.onErrorOccurred.addListener(
      (details) => {
        console.warn('LinkedIn network error:', details);
      },
      { urls: ['https://*.linkedin.com/*'] }
    );
  }

  /**
   * Handle rate limit detection from network layer
   */
  private async handleRateLimitDetection(details: chrome.webRequest.WebResponseCacheDetails): Promise<void> {
    console.error(`Rate limit detected: ${details.statusCode} on ${details.url}`);

    // Stop automation immediately
    await StorageManager.setAutomationEnabled(false);

    // Enable cooldown
    await CooldownManager.enable48HourCooldown(`Rate limit response: ${details.statusCode}`);

    // Show notification
    await this.showEmergencyNotification([{
      type: 'warning',
      severity: 'DEFCON5' as any,
      message: `LinkedIn returned ${details.statusCode} response`,
      timestamp: Date.now(),
      details: { url: details.url, statusCode: details.statusCode },
    }]);

    // Report to backend
    await this.reportWarningToBackend([{
      type: 'warning',
      severity: 'DEFCON5' as any,
      message: `Rate limit: ${details.statusCode}`,
      timestamp: Date.now(),
      details,
    }]);
  }

  /**
   * Generate AI comment using OpenAI directly
   */
  private async generateAIComment(post: any): Promise<string> {
    try {
      if (!this.aiService) {
        // Re-initialize if needed
        await this.initializeAI();
      }

      if (!this.aiService) {
        throw new Error('AI Service not initialized');
      }

      // Analyze post to determine best approach
      const analysis = this.aiService.analyzePostForComment(post.content);

      // Generate engaging comment
      const comment = await this.aiService.generateComment({
        postContent: post.content,
        authorName: post.authorName,
        authorTitle: post.authorTitle,
        tone: analysis.suggestedTone,
        length: analysis.suggestedLength,
      });

      console.log('✅ AI comment generated:', comment.substring(0, 50) + '...');
      return comment;

    } catch (error) {
      console.error('Failed to generate AI comment:', error);
      // High-quality fallback
      return 'This resonates with my own experience. Great perspective on this topic!';
    }
  }

  /**
   * Generate AI post (lead magnet style)
   */
  private async generateAIPost(topic: string, goal?: string, targetAudience?: string): Promise<string> {
    try {
      if (!this.aiService) {
        await this.initializeAI();
      }

      if (!this.aiService) {
        throw new Error('AI Service not initialized');
      }

      const post = await this.aiService.generatePost({
        topic,
        goal: (goal as any) || 'lead_generation',
        tone: 'professional',
        includeCallToAction: true,
        targetAudience,
      });

      console.log('✅ AI post generated:', post.substring(0, 100) + '...');
      return post;

    } catch (error) {
      console.error('Failed to generate AI post:', error);
      throw error;
    }
  }

  /**
   * Verify license key with backend
   */
  private async verifyLicense(licenseKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_API_URL}/api/verify-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      if (result.valid) {
        await chrome.storage.local.set({
          licenseKey,
          licenseValid: true,
          licenseExpiry: result.expiryDate,
          licensePlan: result.plan,
        });
        return true;
      }

      return false;

    } catch (error) {
      console.error('License verification failed:', error);
      return false;
    }
  }

  /**
   * Report action to backend for tracking
   */
  private async reportActionToBackend(action: any): Promise<void> {
    try {
      const data = await chrome.storage.local.get(['licenseKey']);

      await fetch(`${this.BACKEND_API_URL}/api/track-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.licenseKey}`,
        },
        body: JSON.stringify({
          action,
          timestamp: Date.now(),
        }),
      });

    } catch (error) {
      console.error('Failed to report action:', error);
      // Non-critical, continue
    }
  }

  /**
   * Report warning to backend
   */
  private async reportWarningToBackend(signals: any[]): Promise<void> {
    try {
      const data = await chrome.storage.local.get(['licenseKey']);

      await fetch(`${this.BACKEND_API_URL}/api/report-warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.licenseKey}`,
        },
        body: JSON.stringify({
          signals,
          timestamp: Date.now(),
        }),
      });

      // Also send email alert
      await fetch(`${this.BACKEND_API_URL}/api/send-alert-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.licenseKey}`,
        },
        body: JSON.stringify({
          type: 'WARNING_DETECTED',
          signals,
        }),
      });

    } catch (error) {
      console.error('Failed to report warning:', error);
    }
  }

  /**
   * Sync data with backend
   */
  private async syncWithBackend(): Promise<void> {
    try {
      const data = await chrome.storage.local.get(['licenseKey']);
      const stats = await StorageManager.getStatistics();
      const history = await StorageManager.getActionHistory(7); // Last 7 days

      await fetch(`${this.BACKEND_API_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.licenseKey}`,
        },
        body: JSON.stringify({
          stats,
          history,
          timestamp: Date.now(),
        }),
      });

    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  /**
   * Check backend health
   */
  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BACKEND_API_URL}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Show emergency notification
   */
  private async showEmergencyNotification(signals: any[]): Promise<void> {
    const message = signals[0]?.message || 'Critical warning detected';

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: '⚠️ KOMMENTIFY ALERT',
      message: `${message}\n\nAll automation has been stopped for your safety.`,
      priority: 2,
      requireInteraction: true,
    });

    // Also inject modal into page
    this.sendToAllLinkedInTabs({
      type: 'SHOW_MODAL',
      level: 'error',
      title: '⚠️ LinkedIn Warning Detected',
      message,
      signals,
    });
  }

  /**
   * Show warning notification
   */
  private async showWarningNotification(signals: any[]): Promise<void> {
    const message = signals[0]?.message || 'Warning detected';

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Kommentify Warning',
      message,
      priority: 1,
    });
  }

  /**
   * Show info notification
   */
  private async showInfoNotification(message: string): Promise<void> {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Kommentify',
      message,
      priority: 0,
    });
  }

  /**
   * Simple notification wrapper
   */
  private showNotification(title: string, message: string): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
    });
  }

  /**
   * Send message to all LinkedIn tabs
   */
  private async sendToAllLinkedInTabs(message: any): Promise<void> {
    const tabs = await chrome.tabs.query({ url: 'https://*.linkedin.com/*' });

    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Tab may not have content script loaded yet
        });
      }
    }
  }

  /**
   * Get next midnight timestamp
   */
  private getNextMidnight(): number {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return tomorrow.getTime();
  }
}

// Initialize background service
new BackgroundService();

// Export for extension
export { };

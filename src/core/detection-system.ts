/**
 * LINKEDIN BLOCK DETECTION & RESPONSE SYSTEM
 * Real-time monitoring for warning signs and automatic safety responses
 */

import { AlertLevel, DetectionSignal, SessionState } from '../types';

export interface DetectionResult {
  detected: boolean;
  signals: DetectionSignal[];
  recommendedAction: 'STOP' | 'PAUSE' | 'SLOW_DOWN' | 'CONTINUE';
  alertLevel: AlertLevel;
}

export class DetectionSystem {
  private sessionState: SessionState;
  private baselinePerformance: Map<string, number> = new Map();
  private consecutiveFailures: number = 0;
  private lastActionTimes: number[] = [];

  // LinkedIn warning message patterns (update these regularly!)
  private readonly WARNING_PATTERNS = [
    "You're doing this too often",
    "Slow down",
    "Unusual activity",
    "We noticed some unusual activity",
    "Something went wrong",
    "Security check required",
    "Verify you're human",
    "Too many requests",
    "Rate limit",
    "Temporarily restricted",
  ];

  // DOM selectors for warning detection
  private readonly WARNING_SELECTORS = [
    '.artdeco-modal__content',
    '.artdeco-toasts__toast',
    '.security-challenge-container',
    '[data-test="rate-limit-message"]',
    '.artdeco-inline-feedback',
    '.artdeco-modal--layer-default',
    '.error-modal',
    '.msg-overlay-bubble-header',
  ];

  constructor(sessionState: SessionState) {
    this.sessionState = sessionState;
    this.initializeBaselines();
  }

  /**
   * Initialize performance baselines for anomaly detection
   */
  private initializeBaselines(): void {
    this.baselinePerformance.set('pageLoad', 3000); // 3 seconds
    this.baselinePerformance.set('actionComplete', 2000); // 2 seconds
    this.baselinePerformance.set('networkRequest', 1500); // 1.5 seconds
  }

  /**
   * LEVEL 1: DOM-Based Detection
   * Check for visible warning messages and UI changes
   */
  public detectDOMWarnings(): DetectionSignal[] {
    const signals: DetectionSignal[] = [];

    // Check all warning selectors
    for (const selector of this.WARNING_SELECTORS) {
      const elements = document.querySelectorAll(selector);

      elements.forEach((element) => {
        const text = element.textContent || '';

        // Check if text matches any warning pattern
        for (const pattern of this.WARNING_PATTERNS) {
          if (text.toLowerCase().includes(pattern.toLowerCase())) {
            signals.push({
              type: 'warning',
              severity: AlertLevel.DEFCON5, // Maximum alert
              message: `LinkedIn warning detected: "${pattern}"`,
              timestamp: Date.now(),
              details: {
                selector,
                fullText: text,
                pattern,
                screenshot: this.captureElementScreenshot(element),
              },
            });
          }
        }
      });
    }

    // Check for CAPTCHA
    if (this.detectCaptcha()) {
      signals.push({
        type: 'warning',
        severity: AlertLevel.DEFCON5,
        message: 'CAPTCHA challenge detected',
        timestamp: Date.now(),
        details: { type: 'captcha' },
      });
    }

    // Check for disabled action buttons
    if (this.detectDisabledActions()) {
      signals.push({
        type: 'warning',
        severity: AlertLevel.DEFCON4,
        message: 'Action buttons appear disabled',
        timestamp: Date.now(),
        details: { type: 'disabled-ui' },
      });
    }

    // Check for security checkpoint redirect
    if (window.location.href.includes('checkpoint') || window.location.href.includes('security')) {
      signals.push({
        type: 'warning',
        severity: AlertLevel.DEFCON5,
        message: 'Redirected to security checkpoint',
        timestamp: Date.now(),
        details: { url: window.location.href },
      });
    }

    return signals;
  }

  /**
   * LEVEL 2: Behavioral Detection
   * Monitor action responses and performance anomalies
   */
  public detectBehavioralAnomalies(actionDuration: number, actionSuccess: boolean): DetectionSignal[] {
    const signals: DetectionSignal[] = [];
    const baseline = this.baselinePerformance.get('actionComplete') || 2000;

    // Track consecutive failures
    if (!actionSuccess) {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }

    // Multiple consecutive failures
    if (this.consecutiveFailures >= 3) {
      signals.push({
        type: 'error',
        severity: AlertLevel.DEFCON4,
        message: `${this.consecutiveFailures} consecutive action failures detected`,
        timestamp: Date.now(),
        details: { consecutiveFailures: this.consecutiveFailures },
      });
    }

    // Action taking too long (3x baseline)
    if (actionDuration > baseline * 3) {
      signals.push({
        type: 'performance',
        severity: AlertLevel.DEFCON4,
        message: `Action took ${actionDuration}ms (3x normal)`,
        timestamp: Date.now(),
        details: {
          duration: actionDuration,
          baseline,
          ratio: actionDuration / baseline,
        },
      });
    }

    // Check for invisible throttling (action appears successful but isn't)
    // This would be detected by backend verification
    // For now, we flag suspicious quick "successes"
    if (actionSuccess && actionDuration < 500) {
      signals.push({
        type: 'pattern',
        severity: AlertLevel.DEFCON3,
        message: 'Suspiciously fast action completion (possible shadow ban)',
        timestamp: Date.now(),
        details: { duration: actionDuration },
      });
    }

    return signals;
  }

  /**
   * LEVEL 3: Pattern Detection
   * Analyze usage patterns for risk indicators
   */
  public detectPatternRisks(): DetectionSignal[] {
    const signals: DetectionSignal[] = [];
    const now = Date.now();

    // Check if approaching daily maximums
    const dailyLimit = this.getDailyLimit();
    if (this.sessionState.actionsToday >= dailyLimit * 0.9) {
      signals.push({
        type: 'pattern',
        severity: AlertLevel.DEFCON2,
        message: 'Approaching daily action limit (90%)',
        timestamp: now,
        details: {
          actionsToday: this.sessionState.actionsToday,
          limit: dailyLimit,
        },
      });
    }

    // Check session duration
    const sessionDuration = now - this.sessionState.sessionStartTime;
    const sessionHours = sessionDuration / (1000 * 60 * 60);
    if (sessionHours > 0.75) { // 45 minutes
      signals.push({
        type: 'pattern',
        severity: AlertLevel.DEFCON2,
        message: 'Session duration exceeding safe limits',
        timestamp: now,
        details: { sessionHours },
      });
    }

    // Check for too-consistent timing (pattern detection)
    if (this.lastActionTimes.length >= 5) {
      const intervals = [];
      for (let i = 1; i < this.lastActionTimes.length; i++) {
        intervals.push(this.lastActionTimes[i] - this.lastActionTimes[i - 1]);
      }

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // If standard deviation is very low, timing is too consistent
      if (stdDev < avgInterval * 0.15) { // Less than 15% variation
        signals.push({
          type: 'pattern',
          severity: AlertLevel.DEFCON3,
          message: 'Action timing too consistent (bot-like pattern)',
          timestamp: now,
          details: {
            avgInterval,
            stdDev,
            variationPercent: (stdDev / avgInterval) * 100,
          },
        });
      }
    }

    return signals;
  }

  /**
   * Monitor network requests for error codes
   */
  public detectNetworkAnomalies(statusCode: number, endpoint: string): DetectionSignal[] {
    const signals: DetectionSignal[] = [];

    if (statusCode === 429) {
      signals.push({
        type: 'warning',
        severity: AlertLevel.DEFCON5,
        message: '429 Rate Limit response from LinkedIn',
        timestamp: Date.now(),
        details: { statusCode, endpoint },
      });
    }

    if (statusCode === 403) {
      signals.push({
        type: 'warning',
        severity: AlertLevel.DEFCON5,
        message: '403 Forbidden response (possible block)',
        timestamp: Date.now(),
        details: { statusCode, endpoint },
      });
    }

    if (statusCode >= 500) {
      signals.push({
        type: 'error',
        severity: AlertLevel.DEFCON3,
        message: `Server error: ${statusCode}`,
        timestamp: Date.now(),
        details: { statusCode, endpoint },
      });
    }

    return signals;
  }

  /**
   * Comprehensive scan - run all detection methods
   */
  public async performFullScan(lastActionDuration?: number, lastActionSuccess?: boolean): Promise<DetectionResult> {
    const allSignals: DetectionSignal[] = [];

    // Level 1: DOM warnings
    allSignals.push(...this.detectDOMWarnings());

    // Level 2: Behavioral anomalies
    if (lastActionDuration !== undefined && lastActionSuccess !== undefined) {
      allSignals.push(...this.detectBehavioralAnomalies(lastActionDuration, lastActionSuccess));
    }

    // Level 3: Pattern risks
    allSignals.push(...this.detectPatternRisks());

    // Determine overall alert level (highest severity found)
    let alertLevel = AlertLevel.DEFCON1;
    for (const signal of allSignals) {
      if (this.getAlertLevelPriority(signal.severity) > this.getAlertLevelPriority(alertLevel)) {
        alertLevel = signal.severity;
      }
    }

    // Determine recommended action
    let recommendedAction: 'STOP' | 'PAUSE' | 'SLOW_DOWN' | 'CONTINUE' = 'CONTINUE';
    if (alertLevel === AlertLevel.DEFCON5) {
      recommendedAction = 'STOP';
    } else if (alertLevel === AlertLevel.DEFCON4) {
      recommendedAction = 'PAUSE';
    } else if (alertLevel === AlertLevel.DEFCON3 || alertLevel === AlertLevel.DEFCON2) {
      recommendedAction = 'SLOW_DOWN';
    }

    return {
      detected: allSignals.length > 0,
      signals: allSignals,
      recommendedAction,
      alertLevel,
    };
  }

  /**
   * Record action timing for pattern analysis
   */
  public recordActionTime(timestamp: number): void {
    this.lastActionTimes.push(timestamp);
    // Keep only last 20 actions
    if (this.lastActionTimes.length > 20) {
      this.lastActionTimes.shift();
    }
  }

  /**
   * Helper: Detect CAPTCHA challenges
   */
  private detectCaptcha(): boolean {
    const captchaSelectors = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="captcha"]',
      '.g-recaptcha',
      '#px-captcha',
      '.security-challenge-container',
    ];

    return captchaSelectors.some(selector => document.querySelector(selector) !== null);
  }

  /**
   * Helper: Detect disabled action buttons
   */
  private detectDisabledActions(): boolean {
    const actionButtons = document.querySelectorAll('[data-control-name*="like"], [data-control-name*="comment"]');
    let disabledCount = 0;

    actionButtons.forEach(button => {
      if (button.hasAttribute('disabled') || button.classList.contains('disabled')) {
        disabledCount++;
      }
    });

    return disabledCount > actionButtons.length * 0.5; // More than 50% disabled
  }

  /**
   * Helper: Capture element screenshot (as data URL)
   */
  private captureElementScreenshot(element: Element): string {
    try {
      // This would use html2canvas or similar in production
      // For now, return element HTML
      return element.outerHTML.substring(0, 500);
    } catch (e) {
      return 'Screenshot failed';
    }
  }

  /**
   * Helper: Get daily limit based on account age and warmup
   */
  private getDailyLimit(): number {
    // This would be calculated based on warm-up protocol
    // Placeholder for now
    return this.sessionState.isWarmupPhase ? 25 : 100;
  }

  /**
   * Helper: Get alert level priority (higher = more severe)
   */
  private getAlertLevelPriority(level: AlertLevel): number {
    const priorities = {
      [AlertLevel.DEFCON1]: 1,
      [AlertLevel.DEFCON2]: 2,
      [AlertLevel.DEFCON3]: 3,
      [AlertLevel.DEFCON4]: 4,
      [AlertLevel.DEFCON5]: 5,
    };
    return priorities[level];
  }
}

/**
 * RESPONSE PROTOCOL
 * Handles automated responses to detected threats
 */
export class ResponseProtocol {
  /**
   * Execute response based on alert level
   */
  public static async executeResponse(alertLevel: AlertLevel, signals: DetectionSignal[]): Promise<void> {
    switch (alertLevel) {
      case AlertLevel.DEFCON5:
        await this.handleDEFCON5(signals);
        break;
      case AlertLevel.DEFCON4:
        await this.handleDEFCON4(signals);
        break;
      case AlertLevel.DEFCON3:
        await this.handleDEFCON3(signals);
        break;
      case AlertLevel.DEFCON2:
        await this.handleDEFCON2(signals);
        break;
      case AlertLevel.DEFCON1:
        // Normal operations
        break;
    }
  }

  /**
   * DEFCON 5: Maximum alert - immediate stop
   */
  private static async handleDEFCON5(signals: DetectionSignal[]): Promise<void> {
    // STOP all automation immediately
    await this.stopAllAutomation();

    // Enable 48-hour cooldown
    await this.enableCooldown(48 * 60 * 60 * 1000);

    // Show emergency modal to user
    await this.showEmergencyModal(signals);

    // Log to backend
    await this.reportToBackend('DEFCON5', signals);

    // Send email alert
    await this.sendEmailAlert(signals);

    console.error('⚠️ DEFCON 5: LinkedIn warning detected. All automation stopped.');
  }

  /**
   * DEFCON 4: Soft block - pause with option to resume
   */
  private static async handleDEFCON4(signals: DetectionSignal[]): Promise<void> {
    // Pause automation
    await this.pauseAutomation();

    // Increase delays by 200%
    await this.adjustDelays(3.0);

    // Reduce batch size by 50%
    await this.adjustBatchSize(0.5);

    // Show yellow warning
    await this.showWarningBanner(signals);

    // Log incident
    await this.reportToBackend('DEFCON4', signals);

    console.warn('⚠️ DEFCON 4: Possible rate limiting. Automation paused.');
  }

  /**
   * DEFCON 3: Performance issues - slow down
   */
  private static async handleDEFCON3(signals: DetectionSignal[]): Promise<void> {
    // Reduce speed by 50%
    await this.adjustDelays(1.5);

    // Skip next 2 posts
    await this.skipNextActions(2);

    // Show info banner
    await this.showInfoBanner('Performance issues detected. Slowing down for safety.');

    console.info('ℹ️ DEFCON 3: Performance degradation detected.');
  }

  /**
   * DEFCON 2: Pattern risk - introduce breaks
   */
  private static async handleDEFCON2(signals: DetectionSignal[]): Promise<void> {
    // Mandatory 10-minute break
    await this.scheduleBreak(10 * 60 * 1000);

    // Increase randomization
    await this.increaseRandomization();

    // Show recommendation
    await this.showInfoBanner('Taking a safety break to maintain natural patterns.');

    console.info('ℹ️ DEFCON 2: Pattern risk detected. Break scheduled.');
  }

  // Helper methods (would be implemented with actual chrome.storage and messaging)
  private static async stopAllAutomation(): Promise<void> {
    chrome.storage.local.set({ automationEnabled: false, emergencyStop: true });
    chrome.runtime.sendMessage({ type: 'STOP_AUTOMATION' });
  }

  private static async pauseAutomation(): Promise<void> {
    chrome.storage.local.set({ automationPaused: true });
    chrome.runtime.sendMessage({ type: 'PAUSE_AUTOMATION' });
  }

  private static async enableCooldown(duration: number): Promise<void> {
    const cooldownEnd = Date.now() + duration;
    chrome.storage.local.set({ cooldownEnd, automationEnabled: false });
  }

  private static async adjustDelays(multiplier: number): Promise<void> {
    chrome.storage.local.set({ delayMultiplier: multiplier });
  }

  private static async adjustBatchSize(multiplier: number): Promise<void> {
    chrome.storage.local.set({ batchSizeMultiplier: multiplier });
  }

  private static async skipNextActions(count: number): Promise<void> {
    chrome.storage.local.set({ skipNextActions: count });
  }

  private static async scheduleBreak(duration: number): Promise<void> {
    chrome.storage.local.set({ breakUntil: Date.now() + duration });
  }

  private static async increaseRandomization(): Promise<void> {
    chrome.storage.local.set({ randomizationMultiplier: 2.0 });
  }

  private static async showEmergencyModal(signals: DetectionSignal[]): Promise<void> {
    chrome.runtime.sendMessage({
      type: 'SHOW_EMERGENCY_MODAL',
      signals,
    });
  }

  private static async showWarningBanner(signals: DetectionSignal[]): Promise<void> {
    chrome.runtime.sendMessage({
      type: 'SHOW_WARNING',
      level: 'warning',
      signals,
    });
  }

  private static async showInfoBanner(message: string): Promise<void> {
    chrome.runtime.sendMessage({
      type: 'SHOW_INFO',
      message,
    });
  }

  private static async reportToBackend(level: string, signals: DetectionSignal[]): Promise<void> {
    // Would send to cloud backend
    console.log(`Reporting ${level} to backend:`, signals);
  }

  private static async sendEmailAlert(signals: DetectionSignal[]): Promise<void> {
    // Would trigger email via backend
    console.log('Email alert triggered:', signals);
  }
}

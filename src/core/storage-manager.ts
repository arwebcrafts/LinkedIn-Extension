/**
 * STORAGE MANAGER
 * Centralized storage for session state, patterns, and configuration
 */

import { SessionState, ActionPattern, SpeedMode, AccountAge, AlertLevel } from '../types';

export interface StoredData {
  // Session state
  sessionState: SessionState;

  // Action history (last 30 days)
  actionHistory: ActionPattern[];

  // Configuration
  accountAge: AccountAge;
  warmupStartDate: number;

  // Safety
  cooldownEnd?: number;
  cooldownReason?: string;
  warningCount: number;
  lastWarningDate?: number;

  // Limits and restrictions
  dailyActionLimit: number;
  dailyCommentLimit: number;
  speedMode: SpeedMode;

  // Flags
  automationEnabled: boolean;
  automationPaused: boolean;
  emergencyStop: boolean;

  // Profile info
  linkedinProfileUrl?: string;
  profileCompleteness?: {
    hasPhoto: boolean;
    connectionCount: number;
    workExperienceCount: number;
  };

  // Licensing
  licenseKey?: string;
  licenseValid: boolean;
  licenseExpiry?: number;
}

export class StorageManager {
  /**
   * Initialize storage with defaults
   */
  public static async initialize(): Promise<void> {
    const existing = await chrome.storage.local.get(null);

    if (!existing.sessionState) {
      const defaults: Partial<StoredData> = {
        sessionState: {
          actionsToday: 0,
          actionsThisSession: 0,
          sessionStartTime: Date.now(),
          lastActionTime: 0,
          alertLevel: AlertLevel.DEFCON1,
          isWarmupPhase: true,
          warmupDay: 1,
          accountAge: AccountAge.SIX_TO_TWELVE_MONTHS, // Default to safe option
          speedMode: SpeedMode.SLOW,
        },
        actionHistory: [],
        accountAge: AccountAge.SIX_TO_TWELVE_MONTHS,
        warmupStartDate: Date.now(),
        warningCount: 0,
        dailyActionLimit: 50,
        dailyCommentLimit: 10,
        speedMode: SpeedMode.SLOW,
        automationEnabled: false,
        automationPaused: false,
        emergencyStop: false,
        licenseValid: false,
      };

      await chrome.storage.local.set(defaults);
    }
  }

  /**
   * Get session state
   */
  public static async getSessionState(): Promise<SessionState> {
    const data = await chrome.storage.local.get(['sessionState']);
    return data.sessionState || this.getDefaultSessionState();
  }

  /**
   * Update session state
   */
  public static async updateSessionState(updates: Partial<SessionState>): Promise<void> {
    const current = await this.getSessionState();
    const updated = { ...current, ...updates };
    await chrome.storage.local.set({ sessionState: updated });
  }

  /**
   * Record an action
   */
  public static async recordAction(action: ActionPattern): Promise<void> {
    const data = await chrome.storage.local.get(['actionHistory', 'sessionState']);
    const history: ActionPattern[] = data.actionHistory || [];

    // Add new action
    history.push(action);

    // Keep only last 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filtered = history.filter(a => a.timestamp > thirtyDaysAgo);

    // Update session state
    const sessionState: SessionState = data.sessionState;
    sessionState.actionsThisSession++;
    sessionState.actionsToday = this.countActionsToday(filtered);
    sessionState.lastActionTime = action.timestamp;

    await chrome.storage.local.set({
      actionHistory: filtered,
      sessionState,
    });
  }

  /**
   * Get action history
   */
  public static async getActionHistory(days: number = 30): Promise<ActionPattern[]> {
    const data = await chrome.storage.local.get(['actionHistory']);
    const history: ActionPattern[] = data.actionHistory || [];

    const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
    return history.filter(a => a.timestamp > cutoffDate);
  }

  /**
   * Get actions count for today
   */
  public static async getActionsToday(): Promise<{ total: number; comments: number; likes: number }> {
    const history = await this.getActionHistory(1);
    const today = new Date().setHours(0, 0, 0, 0);
    const todayActions = history.filter(a => a.timestamp >= today);

    return {
      total: todayActions.length,
      comments: todayActions.filter(a => a.type === 'COMMENT').length,
      likes: todayActions.filter(a => a.type === 'LIKE').length,
    };
  }

  /**
   * Reset daily counters (call at midnight)
   */
  public static async resetDailyCounters(): Promise<void> {
    const sessionState = await this.getSessionState();
    sessionState.actionsToday = 0;
    await this.updateSessionState(sessionState);
  }

  /**
   * Start new session
   */
  public static async startNewSession(): Promise<void> {
    const sessionState = await this.getSessionState();
    sessionState.actionsThisSession = 0;
    sessionState.sessionStartTime = Date.now();
    sessionState.alertLevel = AlertLevel.DEFCON1;
    await this.updateSessionState(sessionState);
  }

  /**
   * End current session
   */
  public static async endSession(): Promise<void> {
    await chrome.storage.local.set({
      automationPaused: true,
    });
  }

  /**
   * Get configuration
   */
  public static async getConfig(): Promise<{
    accountAge: AccountAge;
    warmupStartDate: number;
    speedMode: SpeedMode;
    dailyActionLimit: number;
    dailyCommentLimit: number;
  }> {
    const data = await chrome.storage.local.get([
      'accountAge',
      'warmupStartDate',
      'speedMode',
      'dailyActionLimit',
      'dailyCommentLimit',
    ]);

    return {
      accountAge: data.accountAge || AccountAge.SIX_TO_TWELVE_MONTHS,
      warmupStartDate: data.warmupStartDate || Date.now(),
      speedMode: data.speedMode || SpeedMode.SLOW,
      dailyActionLimit: data.dailyActionLimit || 50,
      dailyCommentLimit: data.dailyCommentLimit || 10,
    };
  }

  /**
   * Update configuration
   */
  public static async updateConfig(config: {
    accountAge?: AccountAge;
    speedMode?: SpeedMode;
    dailyActionLimit?: number;
    dailyCommentLimit?: number;
  }): Promise<void> {
    await chrome.storage.local.set(config);
  }

  /**
   * Check if automation is enabled
   */
  public static async isAutomationEnabled(): Promise<boolean> {
    const data = await chrome.storage.local.get(['automationEnabled', 'automationPaused', 'emergencyStop']);
    return data.automationEnabled && !data.automationPaused && !data.emergencyStop;
  }

  /**
   * Enable/disable automation
   */
  public static async setAutomationEnabled(enabled: boolean): Promise<void> {
    await chrome.storage.local.set({ automationEnabled: enabled });

    if (enabled) {
      await this.startNewSession();
    }
  }

  /**
   * Get statistics
   */
  public static async getStatistics(): Promise<{
    todayActions: number;
    weekActions: number;
    monthActions: number;
    successRate: number;
    averageActionsPerDay: number;
  }> {
    const history = await this.getActionHistory(30);

    const now = Date.now();
    const today = new Date().setHours(0, 0, 0, 0);
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

    const todayActions = history.filter(a => a.timestamp >= today).length;
    const weekActions = history.filter(a => a.timestamp >= weekAgo).length;
    const monthActions = history.length;

    const successfulActions = history.filter(a => a.success).length;
    const successRate = history.length > 0 ? (successfulActions / history.length) * 100 : 0;

    const daysWithActions = new Set(history.map(a => new Date(a.timestamp).toDateString())).size;
    const averageActionsPerDay = daysWithActions > 0 ? monthActions / daysWithActions : 0;

    return {
      todayActions,
      weekActions,
      monthActions,
      successRate,
      averageActionsPerDay,
    };
  }

  /**
   * Helper: Count actions today
   */
  private static countActionsToday(history: ActionPattern[]): number {
    const today = new Date().setHours(0, 0, 0, 0);
    return history.filter(a => a.timestamp >= today).length;
  }

  /**
   * Helper: Default session state
   */
  private static getDefaultSessionState(): SessionState {
    return {
      actionsToday: 0,
      actionsThisSession: 0,
      sessionStartTime: Date.now(),
      lastActionTime: 0,
      alertLevel: AlertLevel.DEFCON1,
      isWarmupPhase: true,
      warmupDay: 1,
      accountAge: AccountAge.SIX_TO_TWELVE_MONTHS,
      speedMode: SpeedMode.SLOW,
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  public static async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
    await this.initialize();
  }

  /**
   * Export data for backup
   */
  public static async exportData(): Promise<string> {
    const data = await chrome.storage.local.get(null);
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from backup
   */
  public static async importData(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      await chrome.storage.local.set(data);
    } catch (error) {
      throw new Error('Invalid backup data');
    }
  }
}

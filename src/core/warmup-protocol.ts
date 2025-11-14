/**
 * MANDATORY WARM-UP PROTOCOL
 * Account age-based safety restrictions to prevent bans
 */

import { AccountAge, WarmupConfig, SpeedMode, SessionState } from '../types';

export interface WarmupStatus {
  isInWarmup: boolean;
  currentDay: number;
  totalDays: number;
  config: WarmupConfig;
  canProceed: boolean;
  message: string;
  restrictions: string[];
}

export interface ProfileCompleteness {
  hasProfilePhoto: boolean;
  connectionCount: number;
  workExperienceCount: number;
  isComplete: boolean;
  missingElements: string[];
  additionalWarmupDays: number;
}

export class WarmupProtocol {
  private accountAge: AccountAge;
  private warmupStartDate: number;
  private currentDay: number;

  constructor(accountAge: AccountAge, warmupStartDate: number) {
    this.accountAge = accountAge;
    this.warmupStartDate = warmupStartDate;
    this.currentDay = this.calculateCurrentDay();
  }

  /**
   * Calculate current day in warm-up protocol
   */
  private calculateCurrentDay(): number {
    const daysSinceStart = Math.floor((Date.now() - this.warmupStartDate) / (1000 * 60 * 60 * 24));
    return daysSinceStart + 1; // Day 1, Day 2, etc.
  }

  /**
   * Get total warm-up duration based on account age
   */
  private getTotalWarmupDays(): number {
    switch (this.accountAge) {
      case AccountAge.UNDER_3_MONTHS:
        return Infinity; // Blocked
      case AccountAge.THREE_TO_SIX_MONTHS:
        return 28; // 4 weeks
      case AccountAge.SIX_TO_TWELVE_MONTHS:
        return 14; // 2 weeks
      case AccountAge.ONE_TO_TWO_YEARS:
        return 7; // 1 week
      case AccountAge.OVER_TWO_YEARS:
        return 3; // 3 days
      default:
        return 14;
    }
  }

  /**
   * Get warm-up configuration for current day
   */
  public getWarmupConfig(): WarmupConfig {
    // Account under 3 months - BLOCKED
    if (this.accountAge === AccountAge.UNDER_3_MONTHS) {
      return {
        maxActionsPerDay: 0,
        maxCommentsPerDay: 0,
        minActionSpread: 24,
        allowedSpeed: [],
        restrictedToConnections: 1,
        requiresManualApproval: true,
      };
    }

    // 3-6 months - STRICT WARM-UP (28 days)
    if (this.accountAge === AccountAge.THREE_TO_SIX_MONTHS) {
      if (this.currentDay <= 7) {
        // Week 1
        return {
          maxActionsPerDay: 5,
          maxCommentsPerDay: 0, // NO COMMENTS yet
          minActionSpread: 6,
          allowedSpeed: [SpeedMode.ULTRA_SLOW],
          restrictedToConnections: 1, // 1st degree only
          requiresManualApproval: true,
        };
      } else if (this.currentDay <= 14) {
        // Week 2
        return {
          maxActionsPerDay: 10,
          maxCommentsPerDay: 1,
          minActionSpread: 5,
          allowedSpeed: [SpeedMode.ULTRA_SLOW, SpeedMode.SLOW],
          restrictedToConnections: 2, // 1st and 2nd degree
          requiresManualApproval: false,
        };
      } else if (this.currentDay <= 21) {
        // Week 3
        return {
          maxActionsPerDay: 15,
          maxCommentsPerDay: 2,
          minActionSpread: 4,
          allowedSpeed: [SpeedMode.SLOW],
          restrictedToConnections: 2,
          requiresManualApproval: false,
        };
      } else {
        // Week 4
        return {
          maxActionsPerDay: 25,
          maxCommentsPerDay: 3,
          minActionSpread: 4,
          allowedSpeed: [SpeedMode.SLOW, SpeedMode.MEDIUM],
          restrictedToConnections: 3,
          requiresManualApproval: false,
        };
      }
    }

    // 6-12 months - STANDARD WARM-UP (14 days)
    if (this.accountAge === AccountAge.SIX_TO_TWELVE_MONTHS) {
      if (this.currentDay <= 7) {
        // Week 1
        return {
          maxActionsPerDay: 15,
          maxCommentsPerDay: 3,
          minActionSpread: 4,
          allowedSpeed: [SpeedMode.SLOW],
          restrictedToConnections: 3,
          requiresManualApproval: false,
        };
      } else {
        // Week 2
        return {
          maxActionsPerDay: 30,
          maxCommentsPerDay: 7,
          minActionSpread: 3,
          allowedSpeed: [SpeedMode.SLOW, SpeedMode.MEDIUM],
          restrictedToConnections: 3,
          requiresManualApproval: false,
        };
      }
    }

    // 1-2 years - QUICK WARM-UP (7 days)
    if (this.accountAge === AccountAge.ONE_TO_TWO_YEARS) {
      return {
        maxActionsPerDay: 40,
        maxCommentsPerDay: 10,
        minActionSpread: 3,
        allowedSpeed: [SpeedMode.SLOW, SpeedMode.MEDIUM, SpeedMode.NORMAL],
        restrictedToConnections: 3,
        requiresManualApproval: false,
      };
    }

    // 2+ years - MINIMAL WARM-UP (3 days)
    if (this.accountAge === AccountAge.OVER_TWO_YEARS) {
      return {
        maxActionsPerDay: 60,
        maxCommentsPerDay: 15,
        minActionSpread: 3,
        allowedSpeed: [SpeedMode.SLOW, SpeedMode.MEDIUM, SpeedMode.NORMAL],
        restrictedToConnections: 3,
        requiresManualApproval: false,
      };
    }

    // Default fallback
    return {
      maxActionsPerDay: 20,
      maxCommentsPerDay: 5,
      minActionSpread: 4,
      allowedSpeed: [SpeedMode.SLOW],
      restrictedToConnections: 2,
      requiresManualApproval: false,
    };
  }

  /**
   * Get current warm-up status
   */
  public getWarmupStatus(): WarmupStatus {
    const totalDays = this.getTotalWarmupDays();
    const config = this.getWarmupConfig();
    const isInWarmup = this.currentDay <= totalDays;

    // Account under 3 months - BLOCKED
    if (this.accountAge === AccountAge.UNDER_3_MONTHS) {
      return {
        isInWarmup: true,
        currentDay: 0,
        totalDays: Infinity,
        config,
        canProceed: false,
        message: 'Your LinkedIn account is too new for automation. Accounts under 3 months old have high ban risk.',
        restrictions: [
          'Automation is BLOCKED for accounts under 3 months',
          'Build your profile manually',
          'Connect with 100+ people organically',
          'Post and engage manually for 3 months',
          'Return when your account is more established',
          '',
          'You can still use:',
          '• Manual AI comment suggestions (no auto-posting)',
          '• Post writing assistance',
          '• Profile analysis',
        ],
      };
    }

    if (!isInWarmup) {
      return {
        isInWarmup: false,
        currentDay: this.currentDay,
        totalDays,
        config,
        canProceed: true,
        message: 'Warm-up complete! You can now use full automation features.',
        restrictions: [],
      };
    }

    // Build restriction list based on config
    const restrictions: string[] = [];
    restrictions.push(`Day ${this.currentDay} of ${totalDays}`);
    restrictions.push(`Max actions today: ${config.maxActionsPerDay}`);
    if (config.maxCommentsPerDay === 0) {
      restrictions.push('❌ Comments DISABLED (too risky for new accounts)');
    } else {
      restrictions.push(`Max comments today: ${config.maxCommentsPerDay}`);
    }
    restrictions.push(`Actions must be spread over ${config.minActionSpread}+ hours`);
    restrictions.push(`Speed: ${config.allowedSpeed.join(', ')} only`);

    if (config.restrictedToConnections === 1) {
      restrictions.push('🔒 Only engage with 1st-degree connections');
    } else if (config.restrictedToConnections === 2) {
      restrictions.push('🔒 Only engage with 1st & 2nd-degree connections');
    }

    if (config.requiresManualApproval) {
      restrictions.push('⚠️ Manual approval required for each action');
    }

    let message = `Warm-up phase: Day ${this.currentDay}/${totalDays}`;
    if (this.accountAge === AccountAge.THREE_TO_SIX_MONTHS) {
      message += ' (STRICT protocol for 3-6 month accounts)';
    }

    return {
      isInWarmup: true,
      currentDay: this.currentDay,
      totalDays,
      config,
      canProceed: true,
      message,
      restrictions,
    };
  }

  /**
   * Check if action is allowed under warm-up restrictions
   */
  public canPerformAction(
    actionType: 'like' | 'comment' | 'view',
    actionsToday: number,
    commentsToday: number,
    connectionDegree: number,
    currentSpeed: SpeedMode
  ): { allowed: boolean; reason?: string } {
    const config = this.getWarmupConfig();

    // Check daily action limit
    if (actionsToday >= config.maxActionsPerDay) {
      return {
        allowed: false,
        reason: `Daily action limit reached (${config.maxActionsPerDay}). Warm-up Day ${this.currentDay}/${this.getTotalWarmupDays()}.`,
      };
    }

    // Check comment limit
    if (actionType === 'comment' && commentsToday >= config.maxCommentsPerDay) {
      return {
        allowed: false,
        reason: `Daily comment limit reached (${config.maxCommentsPerDay}).`,
      };
    }

    // Check if comments are blocked
    if (actionType === 'comment' && config.maxCommentsPerDay === 0) {
      return {
        allowed: false,
        reason: 'Comments disabled during early warm-up phase (too risky for new accounts).',
      };
    }

    // Check connection degree restriction
    if (connectionDegree > config.restrictedToConnections) {
      return {
        allowed: false,
        reason: `Can only engage with ${this.getConnectionDegreeText(config.restrictedToConnections)} during warm-up.`,
      };
    }

    // Check speed mode
    if (!config.allowedSpeed.includes(currentSpeed)) {
      return {
        allowed: false,
        reason: `Speed mode '${currentSpeed}' not allowed. Use: ${config.allowedSpeed.join(', ')}.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check profile completeness and calculate additional warm-up days
   */
  public static checkProfileCompleteness(
    hasProfilePhoto: boolean,
    connectionCount: number,
    workExperienceCount: number
  ): ProfileCompleteness {
    const missingElements: string[] = [];
    let additionalDays = 0;

    if (!hasProfilePhoto) {
      missingElements.push('Profile photo');
      additionalDays += 7;
    }

    if (connectionCount < 100) {
      missingElements.push(`Only ${connectionCount} connections (need 100+)`);
      additionalDays += 14;
    }

    if (workExperienceCount < 3) {
      missingElements.push(`Only ${workExperienceCount} work experiences (need 3+)`);
      additionalDays += 7;
    }

    return {
      hasProfilePhoto,
      connectionCount,
      workExperienceCount,
      isComplete: missingElements.length === 0,
      missingElements,
      additionalWarmupDays: additionalDays,
    };
  }

  /**
   * Calculate post-warmup limits based on account age
   */
  public getPostWarmupLimits(): { dailyActions: number; percentage: number } {
    const daysSinceWarmupEnd = this.currentDay - this.getTotalWarmupDays();

    if (this.accountAge === AccountAge.THREE_TO_SIX_MONTHS) {
      // Start at 60%, increase to 80% after 30 days, 100% after 60 days
      if (daysSinceWarmupEnd <= 30) {
        return { dailyActions: 60, percentage: 60 };
      } else if (daysSinceWarmupEnd <= 60) {
        return { dailyActions: 80, percentage: 80 };
      } else {
        return { dailyActions: 100, percentage: 100 };
      }
    }

    if (this.accountAge === AccountAge.SIX_TO_TWELVE_MONTHS) {
      // Start at 75%, 100% after 30 days
      if (daysSinceWarmupEnd <= 30) {
        return { dailyActions: 75, percentage: 75 };
      } else {
        return { dailyActions: 100, percentage: 100 };
      }
    }

    // 1-2 years and 2+ years get 100% immediately
    return { dailyActions: 100, percentage: 100 };
  }

  /**
   * Get user-friendly connection degree text
   */
  private getConnectionDegreeText(degree: number): string {
    if (degree === 1) return '1st-degree connections only';
    if (degree === 2) return '1st & 2nd-degree connections';
    return 'all connections';
  }

  /**
   * Parse account age from user input
   */
  public static parseAccountAge(input: string): AccountAge {
    const lower = input.toLowerCase();

    if (lower.includes('<3') || lower.includes('under 3') || lower.includes('less than 3')) {
      return AccountAge.UNDER_3_MONTHS;
    }
    if (lower.includes('3-6') || lower.includes('3 to 6')) {
      return AccountAge.THREE_TO_SIX_MONTHS;
    }
    if (lower.includes('6-12') || lower.includes('6 to 12')) {
      return AccountAge.SIX_TO_TWELVE_MONTHS;
    }
    if (lower.includes('1-2') || lower.includes('1 to 2')) {
      return AccountAge.ONE_TO_TWO_YEARS;
    }
    if (lower.includes('2+') || lower.includes('over 2') || lower.includes('more than 2')) {
      return AccountAge.OVER_TWO_YEARS;
    }

    // Default to safest option
    return AccountAge.THREE_TO_SIX_MONTHS;
  }

  /**
   * Detect account age from LinkedIn profile (if possible)
   */
  public static async detectAccountAge(): Promise<{ detected: boolean; age?: AccountAge; confidence: number }> {
    try {
      // Try to find account creation date from profile URL or page
      // LinkedIn doesn't directly show this, so we estimate from:
      // 1. Earliest work experience
      // 2. Join date if visible
      // 3. Activity history

      // This is a simplified version - production would have more sophisticated detection
      const profileElements = document.querySelectorAll('[data-field="date_range"]');
      if (profileElements.length === 0) {
        return { detected: false, confidence: 0 };
      }

      // Parse dates from profile (placeholder logic)
      // In production, this would analyze the actual profile structure

      return {
        detected: false,
        confidence: 0,
      };
    } catch (error) {
      return { detected: false, confidence: 0 };
    }
  }
}

/**
 * COOLDOWN MANAGER
 * Handles mandatory cooldown periods after warnings
 */
export class CooldownManager {
  /**
   * Check if account is in cooldown
   */
  public static async isInCooldown(): Promise<{ inCooldown: boolean; remainingTime?: number; reason?: string }> {
    const data = await chrome.storage.local.get(['cooldownEnd', 'cooldownReason']);

    if (!data.cooldownEnd) {
      return { inCooldown: false };
    }

    const now = Date.now();
    if (now < data.cooldownEnd) {
      return {
        inCooldown: true,
        remainingTime: data.cooldownEnd - now,
        reason: data.cooldownReason || 'Safety cooldown active',
      };
    }

    // Cooldown expired, clear it
    await chrome.storage.local.remove(['cooldownEnd', 'cooldownReason']);
    return { inCooldown: false };
  }

  /**
   * Enable mandatory 48-hour cooldown after warning
   */
  public static async enable48HourCooldown(reason: string): Promise<void> {
    const cooldownEnd = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
    await chrome.storage.local.set({
      cooldownEnd,
      cooldownReason: reason,
      automationEnabled: false,
      warningCount: (await this.getWarningCount()) + 1,
    });
  }

  /**
   * Get warning count (for permanent restrictions)
   */
  private static async getWarningCount(): Promise<number> {
    const data = await chrome.storage.local.get(['warningCount']);
    return data.warningCount || 0;
  }

  /**
   * Check if account has permanent restrictions (2+ warnings)
   */
  public static async hasPermanentRestrictions(): Promise<boolean> {
    const count = await this.getWarningCount();
    return count >= 2;
  }

  /**
   * Get restriction multiplier based on warning history
   */
  public static async getRestrictionMultiplier(): Promise<number> {
    const count = await this.getWarningCount();
    if (count === 0) return 1.0; // Normal
    if (count === 1) return 0.75; // 75% of normal limits
    return 0.5; // 50% for 2+ warnings (permanent)
  }
}

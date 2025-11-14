/**
 * HUMANIZATION ENGINE
 * Core system for making all actions indistinguishable from human behavior
 */

import { TimingConfig, SpeedMode, SessionState, HumanizationMetrics } from '../types';

export class HumanizationEngine {
  private metrics: HumanizationMetrics;
  private sessionState: SessionState;

  constructor(sessionState: SessionState) {
    this.sessionState = sessionState;
    this.metrics = this.generatePersonalizedMetrics();
  }

  /**
   * Generate unique humanization metrics for this user/session
   * Each user has slightly different typing speed, reaction time, etc.
   */
  private generatePersonalizedMetrics(): HumanizationMetrics {
    return {
      typingSpeed: this.randomRange(40, 80), // WPM
      typoRate: this.randomRange(2, 5) / 100, // 2-5%
      cursorSpeed: this.randomRange(800, 1500), // pixels/sec
      scrollSpeed: this.randomRange(600, 1200),
      reactionTime: this.randomRange(200, 400), // ms
    };
  }

  /**
   * Get timing configuration based on speed mode
   */
  private getTimingConfig(): TimingConfig {
    const configs: Record<SpeedMode, TimingConfig> = {
      [SpeedMode.ULTRA_SLOW]: {
        baseDelay: [45000, 75000], // 45-75 seconds
        readingTime: {
          short: [20000, 35000],
          medium: [40000, 60000],
          long: [70000, 100000],
        },
        microPauses: {
          beforeClick: [1500, 3000],
          afterReading: [2000, 5000],
        },
        breaks: {
          mini: [5, 8],
          medium: [15, 25],
          sessionEnd: 20,
        },
      },
      [SpeedMode.SLOW]: {
        baseDelay: [35000, 55000], // 35-55 seconds
        readingTime: {
          short: [15000, 25000],
          medium: [30000, 50000],
          long: [55000, 85000],
        },
        microPauses: {
          beforeClick: [1000, 2000],
          afterReading: [1500, 3500],
        },
        breaks: {
          mini: [3, 5],
          medium: [10, 18],
          sessionEnd: 30,
        },
      },
      [SpeedMode.MEDIUM]: {
        baseDelay: [25000, 45000], // 25-45 seconds (spec default)
        readingTime: {
          short: [12000, 20000],
          medium: [25000, 40000],
          long: [45000, 75000],
        },
        microPauses: {
          beforeClick: [800, 2000],
          afterReading: [1000, 3000],
        },
        breaks: {
          mini: [2, 4],
          medium: [8, 15],
          sessionEnd: 40,
        },
      },
      [SpeedMode.NORMAL]: {
        baseDelay: [20000, 40000], // 20-40 seconds
        readingTime: {
          short: [10000, 18000],
          medium: [20000, 35000],
          long: [40000, 65000],
        },
        microPauses: {
          beforeClick: [800, 1500],
          afterReading: [1000, 2500],
        },
        breaks: {
          mini: [2, 4],
          medium: [8, 15],
          sessionEnd: 50,
        },
      },
    };

    return configs[this.sessionState.speedMode];
  }

  /**
   * Calculate delay between actions with entropy
   * CRITICAL: Never use same delay twice
   */
  public calculateActionDelay(): number {
    const config = this.getTimingConfig();
    const [min, max] = config.baseDelay;

    // Base delay with crypto randomness
    let delay = this.cryptoRandomRange(min, max);

    // Apply variation (±30%)
    const variation = delay * 0.3;
    delay += this.cryptoRandomRange(-variation, variation);

    // Apply session fatigue (actions slow down over time)
    const fatigueMultiplier = this.calculateFatigueMultiplier();
    delay *= fatigueMultiplier;

    // Apply time-of-day rhythm
    const rhythmMultiplier = this.calculateDailyRhythmMultiplier();
    delay *= rhythmMultiplier;

    // Add entropy to prevent patterns
    const entropy = this.cryptoRandomRange(-2000, 2000);
    delay += entropy;

    return Math.max(delay, 15000); // Never less than 15 seconds
  }

  /**
   * Calculate reading time based on post content
   */
  public calculateReadingTime(wordCount: number, hasImage: boolean, hasVideo: boolean, commentCount: number): number {
    const config = this.getTimingConfig();
    let baseTime: number;

    // Base reading time by word count
    if (wordCount < 100) {
      baseTime = this.cryptoRandomRange(...config.readingTime.short);
    } else if (wordCount < 300) {
      baseTime = this.cryptoRandomRange(...config.readingTime.medium);
    } else {
      baseTime = this.cryptoRandomRange(...config.readingTime.long);
    }

    // Add time for media
    if (hasImage) {
      baseTime += this.cryptoRandomRange(3000, 8000);
    }
    if (hasVideo) {
      baseTime += this.cryptoRandomRange(5000, 15000);
    }

    // Add time if post has many comments (user is reading them)
    if (commentCount > 10) {
      baseTime += this.cryptoRandomRange(5000, 15000);
    }

    // 15% chance to "re-read" (scroll back up)
    if (Math.random() < 0.15) {
      baseTime += this.cryptoRandomRange(3000, 8000);
    }

    return baseTime;
  }

  /**
   * Calculate session fatigue multiplier
   * Users slow down as they get tired
   */
  private calculateFatigueMultiplier(): number {
    const actionsThisSession = this.sessionState.actionsThisSession;

    if (actionsThisSession <= 10) return 1.0; // 100% speed
    if (actionsThisSession <= 20) return 1.1; // 90% speed (10% slower)
    if (actionsThisSession <= 30) return 1.25; // 75% speed
    if (actionsThisSession <= 40) return 1.4; // 60% speed
    return 1.5; // 50% speed for 41+
  }

  /**
   * Calculate time-of-day rhythm multiplier
   * Humans are more/less active at different times
   */
  private calculateDailyRhythmMultiplier(): number {
    const hour = new Date().getHours();

    if (hour >= 9 && hour < 11) return 1.0; // 100% - morning peak
    if (hour >= 11 && hour < 13) return 1.3; // 70% - lunch slowdown
    if (hour >= 13 && hour < 15) return 1.0; // 100% - afternoon peak
    if (hour >= 15 && hour < 17) return 1.2; // 80% - afternoon slowdown
    if (hour >= 17 && hour < 21) return 1.4; // 60% - after hours
    return 2.0; // 30% - night/early morning
  }

  /**
   * Get micro-pause before clicking (hesitation)
   */
  public getBeforeClickPause(): number {
    const config = this.getTimingConfig();
    return this.cryptoRandomRange(...config.microPauses.beforeClick);
  }

  /**
   * Get pause after reading (thinking time)
   */
  public getAfterReadingPause(): number {
    const config = this.getTimingConfig();
    return this.cryptoRandomRange(...config.microPauses.afterReading);
  }

  /**
   * Check if break is needed
   */
  public shouldTakeBreak(): { needed: boolean; type: 'mini' | 'medium' | 'session-end'; duration: number } | null {
    const actions = this.sessionState.actionsThisSession;
    const config = this.getTimingConfig();
    const sessionDuration = Date.now() - this.sessionState.sessionStartTime;
    const sessionHours = sessionDuration / (1000 * 60 * 60);

    // Session end (priority 1)
    if (actions >= config.breaks.sessionEnd || sessionHours >= 1) {
      return {
        needed: true,
        type: 'session-end',
        duration: this.cryptoRandomRange(2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000), // 2-4 hours
      };
    }

    // Medium break (every 25-30 actions)
    if (actions > 0 && actions % this.randomRange(25, 30) === 0) {
      const [min, max] = config.breaks.medium;
      return {
        needed: true,
        type: 'medium',
        duration: this.cryptoRandomRange(min * 60 * 1000, max * 60 * 1000),
      };
    }

    // Mini break (every 8-12 actions)
    if (actions > 0 && actions % this.randomRange(8, 12) === 0) {
      const [min, max] = config.breaks.mini;
      return {
        needed: true,
        type: 'mini',
        duration: this.cryptoRandomRange(min * 60 * 1000, max * 60 * 1000),
      };
    }

    return null;
  }

  /**
   * Simulate typing with realistic speed and typos
   */
  public async simulateTyping(text: string, targetElement: HTMLElement): Promise<void> {
    const words = text.split(' ');
    const wpm = this.metrics.typingSpeed;
    const msPerWord = (60 / wpm) * 1000;

    let currentText = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Type each character
      for (let j = 0; j < word.length; j++) {
        const char = word[j];

        // Random typo?
        if (Math.random() < this.metrics.typoRate) {
          // Type wrong character
          const wrongChar = this.getRandomChar();
          currentText += wrongChar;
          this.setElementValue(targetElement, currentText);
          await this.sleep(this.randomRange(100, 200));

          // Backspace
          currentText = currentText.slice(0, -1);
          this.setElementValue(targetElement, currentText);
          await this.sleep(this.randomRange(100, 200));
        }

        // Type correct character
        currentText += char;
        this.setElementValue(targetElement, currentText);

        // Variable delay per character
        const charDelay = (msPerWord / word.length) + this.randomRange(-50, 50);
        await this.sleep(charDelay);
      }

      // Add space (unless last word)
      if (i < words.length - 1) {
        currentText += ' ';
        this.setElementValue(targetElement, currentText);
        await this.sleep(this.randomRange(50, 150));
      }

      // Longer pause after punctuation
      if (word.match(/[.!?]$/)) {
        await this.sleep(this.randomRange(300, 700));
      }

      // Occasional mid-typing pause (rethinking)
      if (i > 0 && i % 10 === 0 && Math.random() < 0.3) {
        await this.sleep(this.randomRange(2000, 5000));
      }
    }

    // Occasional word deletion and retyping (2% chance per word)
    if (Math.random() < 0.02 && words.length > 5) {
      const wordsArray = currentText.split(' ');
      const deleteCount = this.randomRange(1, 3);

      // Delete words
      for (let i = 0; i < deleteCount; i++) {
        wordsArray.pop();
        const newText = wordsArray.join(' ');
        this.setElementValue(targetElement, newText);
        await this.sleep(this.randomRange(100, 200));
      }

      // Retype
      await this.sleep(this.randomRange(500, 1500));
      // ... would retype here
    }
  }

  /**
   * Generate Bezier curve path for mouse movement
   */
  public generateCursorPath(startX: number, startY: number, endX: number, endY: number, steps: number = 20): Array<{x: number, y: number}> {
    const path: Array<{x: number, y: number}> = [];

    // Control points for Bezier curve
    const cp1x = startX + (endX - startX) * this.randomRange(0.2, 0.4);
    const cp1y = startY + (endY - startY) * this.randomRange(0.2, 0.4);
    const cp2x = startX + (endX - startX) * this.randomRange(0.6, 0.8);
    const cp2y = startY + (endY - startY) * this.randomRange(0.6, 0.8);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = Math.pow(1 - t, 3) * startX +
                3 * Math.pow(1 - t, 2) * t * cp1x +
                3 * (1 - t) * Math.pow(t, 2) * cp2x +
                Math.pow(t, 3) * endX;
      const y = Math.pow(1 - t, 3) * startY +
                3 * Math.pow(1 - t, 2) * t * cp1y +
                3 * (1 - t) * Math.pow(t, 2) * cp2y +
                Math.pow(t, 3) * endY;

      path.push({ x: Math.round(x), y: Math.round(y) });
    }

    return path;
  }

  /**
   * Crypto-secure random number in range
   */
  private cryptoRandomRange(min: number, max: number): number {
    const range = max - min;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const randomBytes = new Uint8Array(bytesNeeded);
    crypto.getRandomValues(randomBytes);

    let randomValue = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      randomValue = (randomValue << 8) + randomBytes[i];
    }

    return min + (randomValue % range);
  }

  /**
   * Simple random range (for non-critical randomness)
   */
  private randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private getRandomChar(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    return chars[this.randomRange(0, chars.length - 1)];
  }

  private setElementValue(element: HTMLElement, value: string): void {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
      // Trigger input event for React/frameworks
      element.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      element.textContent = value;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

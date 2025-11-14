/**
 * CONTENT SCRIPT
 * Runs on LinkedIn pages, handles DOM interaction and action execution
 */

import { HumanizationEngine } from '../core/humanization-engine';
import { DetectionSystem, ResponseProtocol } from '../core/detection-system';
import { WarmupProtocol } from '../core/warmup-protocol';
import { StorageManager } from '../core/storage-manager';
import { ActionType, LinkedInPost, SessionState } from '../types';

class LinkedInAutomation {
  private humanizer: HumanizationEngine | null = null;
  private detector: DetectionSystem | null = null;
  private warmup: WarmupProtocol | null = null;
  private isRunning: boolean = false;
  private currentPost: LinkedInPost | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the content script
   */
  private async init(): Promise<void> {
    console.log('Kommentify: Initializing on LinkedIn...');

    // Initialize storage
    await StorageManager.initialize();

    // Load session state
    const sessionState = await StorageManager.getSessionState();
    const config = await StorageManager.getConfig();

    // Initialize core systems
    this.humanizer = new HumanizationEngine(sessionState);
    this.detector = new DetectionSystem(sessionState);
    this.warmup = new WarmupProtocol(config.accountAge, config.warmupStartDate);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep channel open for async response
    });

    // Start monitoring for warnings (passive)
    this.startPassiveMonitoring();

    // Check if automation should start
    const isEnabled = await StorageManager.isAutomationEnabled();
    if (isEnabled) {
      this.startAutomation();
    }

    console.log('Kommentify: Initialized successfully');
  }

  /**
   * Handle messages from background script or popup
   */
  private async handleMessage(message: any, sendResponse: (response: any) => void): Promise<void> {
    switch (message.type) {
      case 'START_AUTOMATION':
        await this.startAutomation();
        sendResponse({ success: true });
        break;

      case 'STOP_AUTOMATION':
        await this.stopAutomation();
        sendResponse({ success: true });
        break;

      case 'PAUSE_AUTOMATION':
        await this.pauseAutomation();
        sendResponse({ success: true });
        break;

      case 'GET_PAGE_INFO':
        const info = await this.getPageInfo();
        sendResponse(info);
        break;

      case 'DETECT_WARNINGS':
        const detection = await this.detector!.performFullScan();
        sendResponse(detection);
        break;

      case 'MANUAL_ACTION':
        await this.performManualAction(message.action);
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  /**
   * Start automation loop
   */
  private async startAutomation(): Promise<void> {
    if (this.isRunning) {
      console.log('Automation already running');
      return;
    }

    console.log('Starting automation...');
    this.isRunning = true;

    // Start new session
    await StorageManager.startNewSession();

    // Run automation loop
    this.automationLoop();
  }

  /**
   * Main automation loop
   */
  private async automationLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // Check if still enabled
        const isEnabled = await StorageManager.isAutomationEnabled();
        if (!isEnabled) {
          console.log('Automation disabled, stopping...');
          break;
        }

        // Perform full detection scan
        const detection = await this.detector!.performFullScan();

        // Handle detected issues
        if (detection.recommendedAction === 'STOP') {
          console.error('CRITICAL: Stopping automation due to warning detection');
          await ResponseProtocol.executeResponse(detection.alertLevel, detection.signals);
          break;
        }

        if (detection.recommendedAction === 'PAUSE') {
          console.warn('Pausing automation due to soft block detection');
          await ResponseProtocol.executeResponse(detection.alertLevel, detection.signals);
          await this.sleep(10 * 60 * 1000); // 10 minute pause
          continue;
        }

        // Check if break is needed
        const breakCheck = this.humanizer!.shouldTakeBreak();
        if (breakCheck) {
          console.log(`Taking ${breakCheck.type} break for ${breakCheck.duration / 1000}s`);
          await StorageManager.setAutomationEnabled(false);

          // Schedule restart if not session-end
          if (breakCheck.type !== 'session-end') {
            setTimeout(() => {
              StorageManager.setAutomationEnabled(true);
              this.startAutomation();
            }, breakCheck.duration);
          }
          break;
        }

        // Find next post to engage with
        const post = await this.findNextPost();
        if (!post) {
          console.log('No suitable posts found, waiting...');
          await this.sleep(30000); // Wait 30s then try again
          continue;
        }

        // Decide what action to take
        const decision = await this.decideAction(post);
        if (!decision.shouldAct) {
          console.log(`Skipping post: ${decision.reason}`);
          await this.scrollPastPost(post);
          continue;
        }

        // Perform the action
        await this.performAction(post, decision.actionType);

        // Wait before next iteration
        const delay = this.humanizer!.calculateActionDelay();
        console.log(`Waiting ${delay / 1000}s before next action...`);
        await this.sleep(delay);

      } catch (error) {
        console.error('Error in automation loop:', error);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }

    this.isRunning = false;
    console.log('Automation loop ended');
  }

  /**
   * Find next post to engage with
   */
  private async findNextPost(): Promise<LinkedInPost | null> {
    // Scroll feed naturally
    await this.naturalScroll();

    // Find all posts in viewport
    const posts = this.extractPostsFromDOM();

    if (posts.length === 0) {
      return null;
    }

    // Select a post (may skip some for naturalness)
    for (const post of posts) {
      // Random skip (30-40%)
      if (Math.random() < 0.35) {
        continue;
      }

      // Skip viral posts (>1000 likes) 60% of time
      if (post.likeCount > 1000 && Math.random() < 0.6) {
        continue;
      }

      // Skip old posts (>48 hours) 70% of time
      const age = Date.now() - post.timePosted.getTime();
      const hours = age / (1000 * 60 * 60);
      if (hours > 48 && Math.random() < 0.7) {
        continue;
      }

      return post;
    }

    return null;
  }

  /**
   * Extract post data from DOM
   */
  private extractPostsFromDOM(): LinkedInPost[] {
    const posts: LinkedInPost[] = [];

    // LinkedIn post selectors (these may need updating)
    const postElements = document.querySelectorAll('.feed-shared-update-v2');

    postElements.forEach((element, index) => {
      try {
        // Extract post data
        const authorElement = element.querySelector('.feed-shared-actor__name');
        const contentElement = element.querySelector('.feed-shared-text');
        const likeElement = element.querySelector('[data-test-id="social-actions__reaction-count"]');
        const commentElement = element.querySelector('[data-test-id="social-actions__comment-count"]');
        const timeElement = element.querySelector('.feed-shared-actor__sub-description');

        const post: LinkedInPost = {
          id: `post-${index}-${Date.now()}`,
          authorName: authorElement?.textContent?.trim() || 'Unknown',
          content: contentElement?.textContent?.trim() || '',
          wordCount: (contentElement?.textContent?.trim() || '').split(/\s+/).length,
          hasImage: element.querySelector('.feed-shared-image') !== null,
          hasVideo: element.querySelector('.feed-shared-video') !== null,
          likeCount: this.parseCount(likeElement?.textContent || '0'),
          commentCount: this.parseCount(commentElement?.textContent || '0'),
          timePosted: this.parseTimePosted(timeElement?.textContent || ''),
          connectionDegree: this.detectConnectionDegree(element),
        };

        posts.push(post);
      } catch (error) {
        console.error('Error extracting post:', error);
      }
    });

    return posts;
  }

  /**
   * Decide what action to take on a post
   */
  private async decideAction(post: LinkedInPost): Promise<{ shouldAct: boolean; actionType: ActionType; reason: string }> {
    const sessionState = await StorageManager.getSessionState();
    const config = await StorageManager.getConfig();
    const actionsToday = await StorageManager.getActionsToday();

    // Check warmup restrictions
    const warmupCheck = this.warmup!.canPerformAction(
      'like',
      actionsToday.total,
      actionsToday.comments,
      post.connectionDegree,
      config.speedMode
    );

    if (!warmupCheck.allowed) {
      return {
        shouldAct: false,
        actionType: ActionType.SKIP,
        reason: warmupCheck.reason!,
      };
    }

    // Action distribution (mimic human patterns)
    const rand = Math.random();

    if (rand < 0.1) {
      // 10% - Just reading (no action)
      return {
        shouldAct: false,
        actionType: ActionType.SCROLL,
        reason: 'Just reading (no engagement)',
      };
    } else if (rand < 0.6) {
      // 50% - Like only
      return {
        shouldAct: true,
        actionType: ActionType.LIKE,
        reason: 'Like only',
      };
    } else if (rand < 0.85) {
      // 25% - Like + Comment
      const commentCheck = this.warmup!.canPerformAction(
        'comment',
        actionsToday.total,
        actionsToday.comments,
        post.connectionDegree,
        config.speedMode
      );

      if (commentCheck.allowed) {
        return {
          shouldAct: true,
          actionType: ActionType.COMMENT,
          reason: 'Like + Comment',
        };
      } else {
        return {
          shouldAct: true,
          actionType: ActionType.LIKE,
          reason: 'Comment blocked by warmup, like only',
        };
      }
    } else {
      // 15% - Comment only (no like)
      return {
        shouldAct: true,
        actionType: ActionType.COMMENT,
        reason: 'Comment only',
      };
    }
  }

  /**
   * Perform action on a post
   */
  private async performAction(post: LinkedInPost, actionType: ActionType): Promise<void> {
    const startTime = Date.now();
    let success = false;

    try {
      console.log(`Performing ${actionType} on post by ${post.authorName}`);

      // Scroll to post
      await this.scrollToPost(post);

      // Calculate reading time
      const readingTime = this.humanizer!.calculateReadingTime(
        post.wordCount,
        post.hasImage,
        post.hasVideo,
        post.commentCount
      );

      console.log(`Reading for ${readingTime / 1000}s...`);
      await this.sleep(readingTime);

      // Thinking pause
      const thinkingPause = this.humanizer!.getAfterReadingPause();
      await this.sleep(thinkingPause);

      // Perform action based on type
      if (actionType === ActionType.LIKE || actionType === ActionType.COMMENT) {
        await this.clickLike(post);
      }

      if (actionType === ActionType.COMMENT) {
        // Wait a bit after liking
        await this.sleep(this.humanizer!.cryptoRandomRange(2000, 5000));
        await this.postComment(post);
      }

      success = true;

      // Record action
      await StorageManager.recordAction({
        type: actionType,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        postId: post.id,
        success: true,
      });

      // Record timing for pattern analysis
      this.detector!.recordActionTime(Date.now());

    } catch (error) {
      console.error('Action failed:', error);

      // Record failed action
      await StorageManager.recordAction({
        type: actionType,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        postId: post.id,
        success: false,
        errorMessage: (error as Error).message,
      });
    }

    // Check for warnings after action
    const detection = await this.detector!.performFullScan(Date.now() - startTime, success);
    if (detection.detected) {
      await ResponseProtocol.executeResponse(detection.alertLevel, detection.signals);
    }
  }

  /**
   * Click like button with humanization
   */
  private async clickLike(post: LinkedInPost): Promise<void> {
    // Find like button (selector may need updating)
    const likeButton = document.querySelector(`[data-post-id="${post.id}"] [data-control-name="like"]`) as HTMLElement;

    if (!likeButton) {
      throw new Error('Like button not found');
    }

    // Hover before clicking
    const hoverTime = this.humanizer!.getBeforeClickPause();
    this.simulateHover(likeButton);
    await this.sleep(hoverTime);

    // Click
    likeButton.click();

    console.log('Liked post');
  }

  /**
   * Post comment with humanization
   */
  private async postComment(post: LinkedInPost): Promise<void> {
    // Find comment box
    const commentBox = document.querySelector(`[data-post-id="${post.id}"] .comment-box`) as HTMLElement;

    if (!commentBox) {
      throw new Error('Comment box not found');
    }

    // Click to focus
    commentBox.click();
    await this.sleep(1000);

    // Generate AI comment (would call backend API)
    const comment = await this.generateComment(post);

    // Type comment with realistic timing and typos
    await this.humanizer!.simulateTyping(comment, commentBox);

    // Brief pause before submitting
    await this.sleep(this.humanizer!.cryptoRandomRange(1000, 3000));

    // Find and click submit button
    const submitButton = document.querySelector(`[data-post-id="${post.id}"] .comment-submit`) as HTMLElement;
    if (submitButton) {
      submitButton.click();
      console.log('Posted comment');
    }
  }

  /**
   * Generate AI comment (placeholder - would call backend)
   */
  private async generateComment(post: LinkedInPost): Promise<string> {
    // This would call your backend API with OpenAI integration
    // For now, return placeholder
    return 'Great insight! This really resonates with my experience.';
  }

  /**
   * Natural scrolling behavior
   */
  private async naturalScroll(): Promise<void> {
    const scrollAmount = this.humanizer!.cryptoRandomRange(300, 800);
    const scrollSpeed = this.humanizer!.cryptoRandomRange(5, 15);

    let scrolled = 0;
    while (scrolled < scrollAmount) {
      window.scrollBy(0, scrollSpeed);
      scrolled += scrollSpeed;
      await this.sleep(this.humanizer!.cryptoRandomRange(10, 30));

      // Random pause mid-scroll
      if (Math.random() < 0.2) {
        await this.sleep(this.humanizer!.cryptoRandomRange(500, 2000));
      }
    }
  }

  /**
   * Scroll to specific post
   */
  private async scrollToPost(post: LinkedInPost): Promise<void> {
    // Find post element
    const postElement = Array.from(document.querySelectorAll('.feed-shared-update-v2'))
      .find(el => el.textContent?.includes(post.authorName));

    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(1000);
    }
  }

  /**
   * Scroll past post (when skipping)
   */
  private async scrollPastPost(post: LinkedInPost): Promise<void> {
    await this.naturalScroll();
  }

  /**
   * Simulate mouse hover
   */
  private simulateHover(element: HTMLElement): void {
    const event = new MouseEvent('mouseover', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    element.dispatchEvent(event);
  }

  /**
   * Start passive monitoring for warnings
   */
  private startPassiveMonitoring(): void {
    // Check for warnings every 10 seconds
    setInterval(async () => {
      const signals = this.detector!.detectDOMWarnings();
      if (signals.length > 0) {
        console.error('WARNING DETECTED:', signals);
        await ResponseProtocol.executeResponse(signals[0].severity, signals);
      }
    }, 10000);
  }

  /**
   * Get page info (for popup display)
   */
  private async getPageInfo(): Promise<any> {
    const posts = this.extractPostsFromDOM();
    const stats = await StorageManager.getStatistics();
    const warmupStatus = this.warmup!.getWarmupStatus();

    return {
      postsVisible: posts.length,
      stats,
      warmupStatus,
      isRunning: this.isRunning,
    };
  }

  /**
   * Perform manual action (triggered by user)
   */
  private async performManualAction(action: any): Promise<void> {
    // Implementation for manual actions
    console.log('Manual action:', action);
  }

  /**
   * Stop automation
   */
  private async stopAutomation(): Promise<void> {
    this.isRunning = false;
    await StorageManager.setAutomationEnabled(false);
    console.log('Automation stopped');
  }

  /**
   * Pause automation
   */
  private async pauseAutomation(): Promise<void> {
    this.isRunning = false;
    await StorageManager.endSession();
    console.log('Automation paused');
  }

  /**
   * Helpers
   */
  private parseCount(text: string): number {
    const cleaned = text.replace(/,/g, '').trim();
    if (cleaned.includes('K')) {
      return parseFloat(cleaned) * 1000;
    }
    return parseInt(cleaned) || 0;
  }

  private parseTimePosted(text: string): Date {
    // Parse LinkedIn time format ("2h ago", "1d ago", etc.)
    // Simplified for now
    return new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  }

  private detectConnectionDegree(element: Element): number {
    // Detect if 1st, 2nd, or 3rd+ degree connection
    const degreeText = element.textContent || '';
    if (degreeText.includes('1st')) return 1;
    if (degreeText.includes('2nd')) return 2;
    return 3;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LinkedInAutomation();
  });
} else {
  new LinkedInAutomation();
}

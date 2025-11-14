// Core type definitions for Kommentify

export enum AlertLevel {
  DEFCON1 = 'DEFCON1', // Normal
  DEFCON2 = 'DEFCON2', // Pattern risk
  DEFCON3 = 'DEFCON3', // Performance issues
  DEFCON4 = 'DEFCON4', // Soft block
  DEFCON5 = 'DEFCON5', // Warning detected
}

export enum ActionType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  VIEW = 'VIEW',
  SCROLL = 'SCROLL',
  PROFILE_VISIT = 'PROFILE_VISIT',
  SKIP = 'SKIP',
}

export enum SpeedMode {
  ULTRA_SLOW = 'ULTRA_SLOW',
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  NORMAL = 'NORMAL',
}

export enum AccountAge {
  UNDER_3_MONTHS = 'UNDER_3_MONTHS',
  THREE_TO_SIX_MONTHS = 'THREE_TO_SIX_MONTHS',
  SIX_TO_TWELVE_MONTHS = 'SIX_TO_TWELVE_MONTHS',
  ONE_TO_TWO_YEARS = 'ONE_TO_TWO_YEARS',
  OVER_TWO_YEARS = 'OVER_TWO_YEARS',
}

export interface TimingConfig {
  baseDelay: [number, number]; // [min, max] in milliseconds
  readingTime: {
    short: [number, number]; // <100 words
    medium: [number, number]; // 100-300 words
    long: [number, number]; // >300 words
  };
  microPauses: {
    beforeClick: [number, number];
    afterReading: [number, number];
  };
  breaks: {
    mini: [number, number]; // minutes
    medium: [number, number];
    sessionEnd: number; // max actions before end
  };
}

export interface SessionState {
  actionsToday: number;
  actionsThisSession: number;
  sessionStartTime: number;
  lastActionTime: number;
  alertLevel: AlertLevel;
  isWarmupPhase: boolean;
  warmupDay: number;
  accountAge: AccountAge;
  speedMode: SpeedMode;
}

export interface ActionPattern {
  type: ActionType;
  timestamp: number;
  duration: number;
  postId?: string;
  success: boolean;
  errorMessage?: string;
}

export interface DetectionSignal {
  type: 'warning' | 'error' | 'performance' | 'pattern';
  severity: AlertLevel;
  message: string;
  timestamp: number;
  details: Record<string, any>;
}

export interface WarmupConfig {
  maxActionsPerDay: number;
  maxCommentsPerDay: number;
  minActionSpread: number; // hours
  allowedSpeed: SpeedMode[];
  restrictedToConnections: number; // 1 = 1st degree only
  requiresManualApproval: boolean;
}

export interface HumanizationMetrics {
  typingSpeed: number; // WPM
  typoRate: number; // percentage
  cursorSpeed: number; // pixels/sec
  scrollSpeed: number; // pixels/sec
  reactionTime: number; // ms
}

export interface LinkedInPost {
  id: string;
  authorName: string;
  content: string;
  wordCount: number;
  hasImage: boolean;
  hasVideo: boolean;
  likeCount: number;
  commentCount: number;
  timePosted: Date;
  connectionDegree: number;
}

export interface ActionDecision {
  shouldAct: boolean;
  actionType: ActionType;
  delay: number;
  reason: string;
}

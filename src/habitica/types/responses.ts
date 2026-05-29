/**
 * Habitica API Response TypeScript interfaces
 * Based on Habitica API v3 response patterns
 */

import { HabiticaUserData } from "./user";
import { HabiticaTask } from "./tasks";

// Base API response structure
export interface HabiticaApiResponse<T = any> {
  success: boolean;
  data: T;
  notifications?: HabiticaNotification[];
  userV?: number;
  appVersion?: string;
}

// Error response structure
export interface HabiticaApiError {
  success: false;
  error: {
    message: string;
    code?: number;
  };
  notifications?: HabiticaNotification[];
}

// Notification structure
export interface HabiticaNotification {
  id: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "achievement"
    | "login_incentive";
  data: any;
  seen: boolean;
}

// Specific response types for different endpoints

// User data response
export interface HabiticaUserResponse
  extends HabiticaApiResponse<HabiticaUserData> {}

// Tasks response
export interface HabiticaTasksResponse
  extends HabiticaApiResponse<HabiticaTask[]> {}

// Single task response
export interface HabiticaTaskResponse
  extends HabiticaApiResponse<HabiticaTask> {}

// Task creation response
export interface HabiticaTaskCreateResponse
  extends HabiticaApiResponse<HabiticaTask> {}

// Task update response
export interface HabiticaTaskUpdateResponse
  extends HabiticaApiResponse<HabiticaTask> {}

// Task scoring response
export interface HabiticaTaskScoreResponse
  extends HabiticaApiResponse<{
    delta: number;
    hp: number;
    exp: number;
    mp: number;
    gp: number;
    lvl: number;
    drop?: {
      type: string;
      dialog: string;
      value: number;
      key: string;
      notes: string;
    };
  }> {}

// Content response (for getting game content)
export interface HabiticaContentResponse
  extends HabiticaApiResponse<{
    mystery: any;
    gear: any;
    quests: any;
    eggs: any;
    hatchingPotions: any;
    food: any;
    achievements: any;
    faq: any;
    classes: any;
    gearTypes: any;
    cardTypes: any;
    subscriptionBlocks: any;
  }> {}

// Authentication response
export interface HabiticaAuthResponse
  extends HabiticaApiResponse<{
    id: string;
    apiToken: string;
    newUser?: boolean;
  }> {}

// Rate limiting headers
export interface HabiticaRateLimitHeaders {
  "x-ratelimit-limit": string;
  "x-ratelimit-remaining": string;
  "x-ratelimit-reset": string;
  "retry-after"?: string;
}

// Enhanced response with rate limit info
export interface HabiticaApiResponseWithHeaders<T = any>
  extends HabiticaApiResponse<T> {
  headers?: HabiticaRateLimitHeaders;
}

// Type for API request options
export interface HabiticaApiRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers: Record<string, string>;
  body?: any;
}

// Type for API error with detailed information
export interface HabiticaDetailedError extends Error {
  status?: number;
  response?: HabiticaApiError;
  headers?: HabiticaRateLimitHeaders;
  isRateLimit?: boolean;
  retryAfter?: number;
}

// Union type for all possible API responses
export type HabiticaApiResponseUnion =
  | HabiticaUserResponse
  | HabiticaTasksResponse
  | HabiticaTaskResponse
  | HabiticaTaskCreateResponse
  | HabiticaTaskUpdateResponse
  | HabiticaTaskScoreResponse
  | HabiticaContentResponse
  | HabiticaAuthResponse
  | HabiticaApiError;

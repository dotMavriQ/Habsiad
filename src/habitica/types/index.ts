/**
 * Main type exports for Habsiad plugin
 * Centralizes all TypeScript interfaces and types
 */

// Re-export all task-related types
export * from "./tasks";

// Re-export all user-related types
export * from "./user";

// Re-export all API response types
export * from "./responses";

// Re-export all Obsidian-specific types
export * from "./obsidian";

// Convenience type aliases for common combinations
import {
  HabiticaTask,
  HabiticaHabit,
  HabiticaDaily,
  HabiticaTodo,
} from "./tasks";
import { HabiticaUserData, HabiticaUserSummary } from "./user";
import { HabiticaApiResponse } from "./responses";

// Commonly used grouped types
export interface HabiticaFullData {
  user: HabiticaUserData;
  tasks: HabiticaTask[];
  habits: HabiticaHabit[];
  dailies: HabiticaDaily[];
  todos: HabiticaTodo[];
}

// Plugin operational data
export interface PluginOperationalData {
  user: HabiticaUserSummary;
  incompleteTodos: HabiticaTodo[];
  completedDailies: HabiticaDaily[];
  activeHabits: HabiticaHabit[];
  lastSyncTime: Date;
}

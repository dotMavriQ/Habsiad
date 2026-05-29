/**
 * Obsidian-specific TypeScript interfaces and type extensions
 * Ensures proper integration with Obsidian API
 */

import {
  App,
  Plugin,
  TFile,
  Component,
  Modal,
  ItemView,
  PluginSettingTab,
} from "obsidian";
import type { HabiticaService } from "../habiticaService";
import type { SettingsSync } from "../../utils/settingsSync";
import type { HabsiadSettings } from "../../settings";
import type { FrontmatterCommands } from "../../commands/frontmatterUpdates";

// Re-export commonly used Obsidian types for convenience
export { App, Plugin, TFile, Component, Modal, ItemView, PluginSettingTab };

// Extended types for our plugin's specific needs

/**
 * Plugin Settings Interface
 * Defines the structure for all plugin configuration options
 */
export interface HabsiadPluginSettings {
  habiticaApiToken: string;
  habiticaUserId: string;
  journalFolderName: string;
  [key: string]: any; // Allow for additional dynamic settings
}

/**
 * Plugin Interface
 * Defines the contract for the main plugin class to avoid circular dependencies
 */
export interface IHabsiadPlugin {
  app: App;
  settings: HabsiadSettings;
  habiticaService: HabiticaService;
  settingsSync: SettingsSync;
  frontmatterCommands: FrontmatterCommands;
}

// File processing result
export interface FileProcessingResult {
  file: TFile;
  success: boolean;
  changes: string[];
  errors: string[];
  skipped: boolean;
  reason?: string;
}

// Batch operation result
export interface BatchOperationResult {
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  skippedFiles: number;
  results: FileProcessingResult[];
  duration: number; // milliseconds
  errors: string[];
}

// Sync operation status
export interface SyncOperationStatus {
  type: "habit" | "daily" | "todo" | "user" | "full";
  status: "pending" | "running" | "success" | "error" | "cancelled";
  startTime: Date;
  endTime?: Date;
  progress: number; // 0-100
  message: string;
  error?: Error;
}

// Modal data for RetroTagger
export interface RetroTaggerModalData {
  userData?: any; // Will be properly typed later
  taskData?: any; // Will be properly typed later
  achievements: string[];
  dailies: string[];
  selectedItems: Set<string>;
  currentFilter: "all" | "achievements" | "dailies";
}

// Data quality check result
export interface DataQualityCheckResult {
  checkName: string;
  passed: boolean;
  severity: "info" | "warning" | "error";
  message: string;
  file?: TFile;
  line?: number;
  suggestion?: string;
  autoFixAvailable: boolean;
}

// Data quality report
export interface DataQualityReport {
  timestamp: Date;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: DataQualityCheckResult[];
  summary: {
    info: number;
    warnings: number;
    errors: number;
  };
}

// Plugin state interface
export interface HabsiadPluginState {
  isInitialized: boolean;
  lastSyncTime?: Date;
  syncInProgress: boolean;
  currentSyncOperation?: SyncOperationStatus;
  apiRateLimitRemaining: number;
  apiRateLimitReset?: Date;
  dataQualityLastCheck?: Date;
  errors: string[];
}

// Event types for plugin communication
export interface HabsiadPluginEvents {
  "sync-started": SyncOperationStatus;
  "sync-progress": SyncOperationStatus;
  "sync-completed": SyncOperationStatus;
  "sync-error": { operation: SyncOperationStatus; error: Error };
  "data-quality-check": DataQualityReport;
  "settings-changed": Partial<HabsiadPluginSettings>;
  "api-rate-limit": { remaining: number; resetTime: Date };
}

// Command interface for plugin commands
export interface HabsiadCommand {
  id: string;
  name: string;
  checkCallback?: (checking: boolean) => boolean | void;
  callback?: () => void;
  hotkeys?: Array<{
    modifiers: string[];
    key: string;
  }>;
  editorCallback?: (editor: any, view: any) => void;
  editorCheckCallback?: (
    checking: boolean,
    editor: any,
    view: any
  ) => boolean | void;
}

// View type for sidebar views
export interface HabsiadViewType {
  type: string;
  name: string;
  icon: string;
}

// Error types specific to our plugin
export class HabsiadPluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: "api" | "file" | "sync" | "validation" | "config",
    public originalError?: Error
  ) {
    super(message);
    this.name = "HabsiadPluginError";
  }
}

export class HabsiadApiError extends HabsiadPluginError {
  constructor(
    message: string,
    public status: number,
    public apiResponse?: any,
    originalError?: Error
  ) {
    super(message, `API_ERROR_${status}`, "api", originalError);
    this.name = "HabsiadApiError";
  }
}

export class HabsiadSyncError extends HabsiadPluginError {
  constructor(
    message: string,
    public syncType: string,
    public affectedFiles: string[],
    originalError?: Error
  ) {
    super(
      message,
      `SYNC_ERROR_${syncType.toUpperCase()}`,
      "sync",
      originalError
    );
    this.name = "HabsiadSyncError";
  }
}

// Type guards for error checking
export function isHabsiadPluginError(
  error: unknown
): error is HabsiadPluginError {
  return error instanceof HabsiadPluginError;
}

export function isHabsiadApiError(error: unknown): error is HabsiadApiError {
  return error instanceof HabsiadApiError;
}

export function isHabsiadSyncError(error: unknown): error is HabsiadSyncError {
  return error instanceof HabsiadSyncError;
}

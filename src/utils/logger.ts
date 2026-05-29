/**
 * Centralized logging utility for Habsiad Plugin
 * Provides different log levels and can be disabled in production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

class HabsiadLogger {
  private currentLevel: LogLevel = LogLevel.ERROR; // Default to ERROR in production
  private prefix = "[Habsiad]";

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.DEBUG) {
      console.log(`${this.prefix} [DEBUG]`, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.INFO) {
      console.log(`${this.prefix} [INFO]`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.WARN) {
      console.warn(`${this.prefix} [WARN]`, message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.currentLevel <= LogLevel.ERROR) {
      console.error(`${this.prefix} [ERROR]`, message, ...args);
    }
  }

  // Compatibility method for existing console.log calls
  log(message: string, ...args: any[]): void {
    this.debug(message, ...args);
  }
}

// Export singleton instance
export const logger = new HabsiadLogger();

// For development, you can enable debug logging by calling:
// logger.setLevel(LogLevel.DEBUG);

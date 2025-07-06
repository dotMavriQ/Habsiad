import { TFile, Notice } from "obsidian";
import HabsiadPlugin from "../main";
import { HabsiadSettings } from "../settings";

/**
 * Settings synchronization utility for cross-device sync
 * Stores settings in a file within the vault so they sync to mobile
 */
export class SettingsSync {
  private plugin: HabsiadPlugin;
  private syncFilePath: string =
    ".obsidian/plugins/Habsiad/habsiad-settings.json";

  constructor(plugin: HabsiadPlugin) {
    this.plugin = plugin;
  }

  /**
   * Save settings to both Obsidian's data.json AND a sync file in the vault
   */
  async saveSettings(settings: HabsiadSettings): Promise<void> {
    try {
      // Save to Obsidian's normal data.json
      await this.plugin.saveData(settings);

      // Also save to a sync file in the vault for cross-device sync
      await this.saveSyncFile(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      new Notice("Failed to save settings");
    }
  }

  /**
   * Load settings with fallback priority:
   * 1. Obsidian's data.json (if exists)
   * 2. Sync file in vault (if data.json missing)
   * 3. Default settings (if neither exists)
   */
  async loadSettings(): Promise<HabsiadSettings> {
    try {
      // First try to load from Obsidian's normal data.json
      const localData = await this.plugin.loadData();

      if (localData && Object.keys(localData).length > 0) {
        // data.json exists and has content, use it
        console.log("Loaded settings from data.json");
        return localData;
      }

      // data.json is missing or empty, try to load from sync file
      const syncData = await this.loadSyncFile();
      if (syncData) {
        console.log("Loaded settings from sync file (data.json was missing)");
        // Save to data.json for future use
        await this.plugin.saveData(syncData);
        new Notice("Settings restored from vault sync file");
        return syncData;
      }

      // Neither file exists, return defaults
      console.log("No settings found, using defaults");
      return {} as HabsiadSettings; // Will be merged with defaults in main.ts
    } catch (error) {
      console.error("Error loading settings:", error);
      return {} as HabsiadSettings;
    }
  }

  /**
   * Save settings to sync file in vault
   */
  private async saveSyncFile(settings: HabsiadSettings): Promise<void> {
    try {
      // Create a clean copy without sensitive data for sync
      const syncSettings = this.sanitizeForSync(settings);
      const jsonContent = JSON.stringify(syncSettings, null, 2);

      await this.plugin.app.vault.adapter.write(this.syncFilePath, jsonContent);
    } catch (error) {
      console.warn("Could not save sync file:", error);
      // Don't throw - this is a nice-to-have feature
    }
  }

  /**
   * Load settings from sync file in vault
   */
  private async loadSyncFile(): Promise<HabsiadSettings | null> {
    try {
      const content = await this.plugin.app.vault.adapter.read(
        this.syncFilePath
      );
      return JSON.parse(content);
    } catch (error) {
      console.warn("Could not load sync file:", error);
      return null;
    }
  }

  /**
   * Remove or mask sensitive data before syncing
   * You might want to exclude API tokens from syncing for security
   */
  private sanitizeForSync(settings: HabsiadSettings): HabsiadSettings {
    const syncSettings = { ...settings };

    // Option 1: Sync everything (including API keys)
    // This is convenient but less secure
    return syncSettings;

    // Option 2: Exclude sensitive data (uncomment if you prefer this)
    // syncSettings.habiticaApiToken = ""; // Don't sync API token
    // return syncSettings;
  }

  /**
   * Manual sync operation - import settings from sync file
   */
  async importFromSyncFile(): Promise<boolean> {
    try {
      const syncData = await this.loadSyncFile();
      if (!syncData) {
        new Notice("No sync file found to import from");
        return false;
      }

      // Merge with current settings, prioritizing sync file
      this.plugin.settings = Object.assign({}, this.plugin.settings, syncData);
      await this.saveSettings(this.plugin.settings);

      new Notice("Settings imported from sync file");
      return true;
    } catch (error) {
      console.error("Error importing from sync file:", error);
      new Notice("Failed to import settings from sync file");
      return false;
    }
  }

  /**
   * Manual sync operation - export current settings to sync file
   */
  async exportToSyncFile(): Promise<boolean> {
    try {
      await this.saveSyncFile(this.plugin.settings);
      new Notice("Settings exported to sync file");
      return true;
    } catch (error) {
      console.error("Error exporting to sync file:", error);
      new Notice("Failed to export settings to sync file");
      return false;
    }
  }

  /**
   * Check if sync file exists
   */
  async syncFileExists(): Promise<boolean> {
    try {
      await this.plugin.app.vault.adapter.stat(this.syncFilePath);
      return true;
    } catch {
      return false;
    }
  }
}

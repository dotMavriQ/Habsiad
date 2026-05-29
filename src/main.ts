import {
  App,
  Plugin,
  Notice,
  TFile,
  MarkdownView,
  WorkspaceLeaf,
  TFolder,
  TAbstractFile,
  Modal,
  Setting,
} from "obsidian";
import { HabiticaService } from "./habitica/habiticaService";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/sidebarView";
import {
  HabsiadSettingTab,
  DEFAULT_SETTINGS,
  HabsiadSettings,
} from "./settings";
import { SettingsSync } from "./utils/settingsSync";
import { RetroTaggerModal } from "./modals/retroTagger";
import { HabiticaSyncCommand } from "./commands/habiticaSync";
import { FrontmatterCommands } from "./commands/frontmatterUpdates";
import { UtilityCommands } from "./commands/utilityCommands";
import { CalorieCalculations } from "./commands/calorieCalculations";

export default class HabsiadPlugin extends Plugin {
  public habiticaService!: HabiticaService;
  public settings: HabsiadSettings = DEFAULT_SETTINGS; // ✅ Ensures initialization
  public settingsSync!: SettingsSync;

  // Command handlers
  private habiticaSyncCommand!: HabiticaSyncCommand;
  public frontmatterCommands!: FrontmatterCommands;
  private utilityCommands!: UtilityCommands;
  public calorieCalculations!: CalorieCalculations;

  async onload() {
    // Plugin loading is now handled by Obsidian's internal logging

    // Initialize settings sync
    this.settingsSync = new SettingsSync(this);

    // Load settings (with cross-device sync support)
    await this.loadSettings();

    // Initialize Habitica Service
    this.habiticaService = new HabiticaService(this);

    // Initialize command handlers
    this.habiticaSyncCommand = new HabiticaSyncCommand(this);
    this.frontmatterCommands = new FrontmatterCommands(this);
    this.utilityCommands = new UtilityCommands(this);
    this.calorieCalculations = new CalorieCalculations(this);

    // Add settings tab
    this.addSettingTab(new HabsiadSettingTab(this.app, this));

    // Register the sidebar view
    this.registerView(
      VIEW_TYPE_SIDEBAR,
      (leaf: WorkspaceLeaf) => new SidebarView(leaf, this)
    );

    // Activate the sidebar view
    this.app.workspace.onLayoutReady(() => {
      this.activateSidebar();
    });

    // Register commands with customizable hotkeys
    this.addCommand({
      id: "generate-habits-and-dailies",
      name: "Generate Habits & Dailies",
      callback: () => this.habiticaSyncCommand.generateHabitsAndDailies(),
    });

    // Register the command to replace {WEEKDAY} with the correct day (Manual Trigger)
    this.addCommand({
      id: "replace-weekday",
      name: "Replace {WEEKDAY} with Actual Day",
      callback: () => this.utilityCommands.replaceWeekday(),
    });

    // Register the TODO-Sync command
    this.addCommand({
      id: "sync-todo",
      name: "Sync Habitica TODO",
      callback: () => this.utilityCommands.syncTodo(),
    });

    // Register the Habitica to Frontmatter sync command
    this.addCommand({
      id: "sync-habitica-to-frontmatter",
      name: "Sync Habitica to Frontmatter",
      callback: () => this.syncHabiticaToFrontmatter(),
    });

    // Register the Basic Habitica Stats sync command
    this.addCommand({
      id: "sync-basic-habitica-stats",
      name: "Sync Basic Habitica Stats",
      callback: () => this.utilityCommands.syncBasicHabiticaStats(),
    });

    // Register the Calculate Calorie Totals command
    this.addCommand({
      id: "calculate-calorie-totals",
      name: "Calculate Calorie Totals",
      callback: () => this.calorieCalculations.calculateCalorieTotals(),
    });

    // Register the Retrotagger command
    this.addCommand({
      id: "open-retrotagger",
      name: "Open Retrotagger",
      callback: () => this.openRetrotagger(),
    });

    // Register settings sync commands
    this.addCommand({
      id: "import-settings-from-sync",
      name: "Import Settings from Sync File",
      callback: () => this.settingsSync.importFromSyncFile(),
    });

    this.addCommand({
      id: "export-settings-to-sync",
      name: "Export Settings to Sync File",
      callback: () => this.settingsSync.exportToSyncFile(),
    });

    // Automatically replace {WEEKDAY} when a new file is created in the JOURNAL folder,
    // but only if the file contains the "# {WEEKDAY}" placeholder.
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!(file instanceof TFile)) return;

        const journalFolderName = this.settings.journalFolderName || "Journal";
        if (file.path.startsWith(`${journalFolderName}/`)) {
          // Read the file content to check for the placeholder
          const content = await this.app.vault.read(file);
          if (content.includes("# {WEEKDAY}")) {
            this.utilityCommands.replaceWeekday(file);
          }
        }
      })
    );
  }

  onunload() {
    // Plugin unloading is now handled by Obsidian's internal logging
    // Note: Not detaching leaves as per Obsidian guidelines - leaves should persist
  }

  async activateSidebar() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_SIDEBAR).length === 0) {
      const rightLeaf = this.app.workspace.getRightLeaf(true);
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: VIEW_TYPE_SIDEBAR,
        });
      } else {
        console.error("Failed to get or create the right leaf.");
      }
    }
  }

  async loadSettings() {
    const loadedSettings = await this.settingsSync.loadSettings();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings);

    // Migration: Ensure alcohol tab is enabled by default if it doesn't exist
    if (
      this.settings.showTabs &&
      this.settings.showTabs.alcohol === undefined
    ) {
      this.settings.showTabs.alcohol = true;
      await this.saveSettings();
    }
  }

  async saveSettings() {
    await this.settingsSync.saveSettings(this.settings);
  }

  /**
   * Opens the RetroTagger modal for the current journal entry.
   * Allows users to retroactively add achievements and dailies to journal entries.
   */
  openRetrotagger() {
    const modal = new RetroTaggerModal(this.app, this);
    modal.open();
  }

  async saveCustomFrontmatterName(key: string, value: string) {
    await this.frontmatterCommands.saveCustomFrontmatterName(key, value);
  }

  getCustomFrontmatterName(key: string): string {
    return this.settings.customFrontmatter?.[key] || "";
  }

  // Wrapper methods for frontmatter commands (for backward compatibility with views)
  async updateStepsFrontmatter(file: TFile, newSteps: string) {
    await this.frontmatterCommands.updateStepsFrontmatter(file, newSteps);
  }

  async updateWeightFrontmatter(file: TFile, newWeight: string) {
    await this.frontmatterCommands.updateWeightFrontmatter(file, newWeight);
  }

  async updateCaloriesFrontmatter(file: TFile, newCalories: string) {
    await this.frontmatterCommands.updateCaloriesFrontmatter(file, newCalories);
  }

  /**
   * Syncs Habitica data to frontmatter in all journal files.
   * - Scans all YYYY-MM-DD.md files in the journal folder
   * - Looks for "Achievements on {date}" and "Completed Dailies" headers
   * - Processes the bullet lists under those headers
   * - Updates the frontmatter with values from the Habitica data
   */
  async syncHabiticaToFrontmatter() {
    const journalFolderName = this.settings.journalFolderName || "Journal";
    const journalFolder =
      this.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      new Notice(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    // Get the frontmatter glossary mapping
    const pluginFolder = `${this.app.vault.configDir}/plugins/Habsiad`;
    const glossaryFileName = "frontmatterGlossary.json";
    const glossaryPath = `${pluginFolder}/${glossaryFileName}`;

    let glossaryMapping: { [key: string]: any } = {};
    try {
      const data = await this.app.vault.adapter.read(glossaryPath);
      glossaryMapping = JSON.parse(data);
    } catch (error) {
      new Notice(
        "Could not read frontmatter glossary. Please set up glossary first."
      );
      console.error("Error reading glossary:", error);
      return;
    }

    // Create a reverse mapping (Habitica key -> frontmatter key)
    const reverseMapping: { [key: string]: string } = {};
    for (const [frontmatterKey, value] of Object.entries(glossaryMapping)) {
      let habiticaKey = "";
      if (typeof value === "string") {
        // Old format: string values
        habiticaKey = value;
      } else if (typeof value === "object" && value !== null) {
        // New format: object with habiticaKey property
        const entry = value as { habiticaKey?: string; isDisabled?: boolean };
        if (!entry.isDisabled) {
          habiticaKey = entry.habiticaKey || "";
        }
      }

      if (habiticaKey) {
        reverseMapping[habiticaKey] = frontmatterKey;
      }
    }

    // Process all journal files
    const filteredFiles = journalFolder.children.filter(
      (file: TAbstractFile) =>
        file instanceof TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)
    ) as TFile[];

    const journalFiles = filteredFiles.sort((a: TFile, b: TFile) =>
      b.name.localeCompare(a.name)
    ); // Sort by date descending

    let filesProcessed = 0;
    let filesUpdated = 0;

    for (const file of journalFiles) {
      filesProcessed++;
      const content = await this.app.vault.read(file);

      // Check if the file has the required headers
      const achievementsHeaderRegex = /^## Achievements on \d{4}-\d{2}-\d{2}/m;
      const dailiesHeaderRegex = /^## Completed Dailies/m;

      if (
        !achievementsHeaderRegex.test(content) &&
        !dailiesHeaderRegex.test(content)
      ) {
        continue; // Skip this file if it doesn't have the required headers
      }

      // Extract the habit counter values and completed dailies from the content
      const habitCounters: { [key: string]: number } = {};
      const completedDailies: string[] = [];

      // Extract habit counters (e.g., "Habit clicked: Act of Love 💖 - Positive: 2, Negative: 0")
      const habitRegex =
        /\* Habit clicked: (.*?) - Positive: (\d+), Negative: (\d+)/g;
      let habitMatch;
      while ((habitMatch = habitRegex.exec(content)) !== null) {
        const habitName = habitMatch[1];
        const positiveCount = parseInt(habitMatch[2], 10) || 0;
        const negativeCount = parseInt(habitMatch[3], 10) || 0;
        const netCount = positiveCount - negativeCount;

        // Store the habit by its full name for matching purposes
        habitCounters[habitName] = netCount;
      }

      // Extract completed dailies (e.g., "* Daily Name")
      const dailiesSection = content.match(
        /## Completed Dailies\n([\s\S]*?)(?=\n##|$)/
      );
      if (dailiesSection && dailiesSection[1]) {
        const dailiesList = dailiesSection[1].trim().split("\n");
        dailiesList.forEach((daily) => {
          if (daily.startsWith("* ")) {
            completedDailies.push(daily.substring(2).trim());
          }
        });
      }

      // Update frontmatter based on glossary mapping
      let frontmatterUpdates: { [key: string]: number } = {};

      // Process habits based on Habitica keys in glossary
      for (const [habitName, netCount] of Object.entries(habitCounters)) {
        // Look through all Habitica keys to find a match
        for (const [habiticaKey, frontmatterKey] of Object.entries(
          reverseMapping
        )) {
          if (habitName.includes(habiticaKey)) {
            frontmatterUpdates[frontmatterKey] = netCount;
            break;
          }
        }
      }

      // Process dailies based on Habitica keys in glossary
      for (const dailyName of completedDailies) {
        for (const [habiticaKey, frontmatterKey] of Object.entries(
          reverseMapping
        )) {
          if (dailyName.includes(habiticaKey)) {
            // For completed dailies, set the value to 1
            frontmatterUpdates[frontmatterKey] = 1;
            break;
          }
        }
      }

      // If we have updates to make, update the frontmatter
      if (Object.keys(frontmatterUpdates).length > 0) {
        await this.updateFrontmatterValues(file, frontmatterUpdates);
        filesUpdated++;
      }
    }

    if (filesUpdated > 0) {
      new Notice(
        `Updated frontmatter in ${filesUpdated} of ${filesProcessed} journal files.`
      );
    } else {
      new Notice(`No updates needed. Checked ${filesProcessed} journal files.`);
    }
  }

  /**
   * Updates multiple frontmatter values in a file.
   */
  async updateFrontmatterValues(file: TFile, updates: { [key: string]: any }) {
    let content = await this.app.vault.read(file);

    // Locate frontmatter section
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    let newContent;

    if (match) {
      let frontmatterText = match[1];
      const frontmatterLines = frontmatterText.split("\n");
      const updatedLines = [...frontmatterLines];

      // Track which keys we've updated
      const updatedKeys = new Set<string>();

      // Update existing frontmatter lines
      for (let i = 0; i < frontmatterLines.length; i++) {
        const line = frontmatterLines[i];
        for (const [key, value] of Object.entries(updates)) {
          if (line.startsWith(`${key}:`)) {
            updatedLines[i] = `${key}: ${value}`;
            updatedKeys.add(key);
            break;
          }
        }
      }

      // Add new frontmatter lines for keys not found
      for (const [key, value] of Object.entries(updates)) {
        if (!updatedKeys.has(key)) {
          updatedLines.push(`${key}: ${value}`);
        }
      }

      // Replace the frontmatter block
      newContent = content.replace(
        frontmatterRegex,
        `---\n${updatedLines.join("\n")}\n---`
      );
    } else {
      // If no frontmatter exists, create it
      const frontmatterLines = Object.entries(updates).map(
        ([key, value]) => `${key}: ${value}`
      );
      newContent = `---\n${frontmatterLines.join("\n")}\n---\n\n${content}`;
    }

    // Save the updated file
    await this.app.vault.modify(file, newContent);
  }
}

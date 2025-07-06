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

// RetroTagger modal for adding achievements and dailies to journal entries
class RetroTaggerModal extends Modal {
  private plugin: HabsiadPlugin;
  private selectedItems: { [key: string]: string } = {}; // key -> "achievement" or "daily"
  private itemButtons: { [key: string]: HTMLElement } = {};
  private journalDate: string;
  
  constructor(app: App, plugin: HabsiadPlugin) {
    super(app);
    this.plugin = plugin;
    this.journalDate = "";
  }
  
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    
    // Get current file to check if it's a journal entry
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      contentEl.createEl("div", { text: "No file is currently open." });
      return;
    }
    
    // Check if the file is in the journal folder and has the YYYY-MM-DD.md format
    const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
    const filePathLower = activeFile.path.toLowerCase();
    const journalFolderLower = journalFolderName.toLowerCase();
    
    if (!filePathLower.startsWith(`${journalFolderLower}/`)) {
      contentEl.createEl("div", { text: `This file is not in the ${journalFolderName} folder.` });
      return;
    }
    
    const match = activeFile.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    if (!match) {
      contentEl.createEl("div", { text: "This file is not a valid journal entry (YYYY-MM-DD.md format required)." });
      return;
    }
    
    this.journalDate = match[1];
    
    // Create the main container for the retrotagger UI
    const mainContainer = contentEl.createDiv({ cls: "retrotagger-container" });
    
    // Add header
    mainContainer.createEl("h2", { text: `RetroTagger - ${this.journalDate}` });
    
    // Add instructions
    const instructionsDiv = mainContainer.createDiv({ cls: "retrotagger-instructions" });
    instructionsDiv.createEl("p", { text: "Click once on an item to add it to Achievements (blue)." });
    instructionsDiv.createEl("p", { text: "Click twice on an item to add it to Dailies (green)." });
    instructionsDiv.createEl("p", { text: "Click a third time to deselect." });
    
    // Create container for Habitica items
    const itemsContainer = mainContainer.createDiv({ cls: "retrotagger-items" });
    
    // Load the glossary to get Habitica keys
    const habiticaKeys = await this.loadHabiticaKeys();
    
    // Create buttons for each Habitica item
    for (const habiticaKey of habiticaKeys) {
      if (!habiticaKey) continue;
      
      const itemButton = itemsContainer.createEl("button", {
        text: habiticaKey,
        cls: "retrotagger-item"
      });
      
      this.itemButtons[habiticaKey] = itemButton;
      
      itemButton.addEventListener("click", () => {
        this.toggleItemSelection(habiticaKey);
      });
    }
    
    // Create the "Summary" section to preview what will be added
    const summaryContainer = mainContainer.createDiv({ cls: "retrotagger-summary" });
    summaryContainer.createEl("h3", { text: "Summary" });
    
    const achievementsDiv = summaryContainer.createDiv({ cls: "retrotagger-achievements" });
    achievementsDiv.createEl("h4", { text: "Achievements to add:" });
    const achievementsList = achievementsDiv.createEl("ul", { cls: "retrotagger-achievements-list" });
    
    const dailiesDiv = summaryContainer.createDiv({ cls: "retrotagger-dailies" });
    dailiesDiv.createEl("h4", { text: "Dailies to add:" });
    const dailiesList = dailiesDiv.createEl("ul", { cls: "retrotagger-dailies-list" });
    
    // Add the "Render" button
    const renderButton = mainContainer.createEl("button", {
      text: "Render",
      cls: "retrotagger-render-button"
    });
    
    renderButton.addEventListener("click", async () => {
      await this.renderSelectedItems();
      this.close();
    });
    
    // Add "Cancel" button
    const cancelButton = mainContainer.createEl("button", {
      text: "Cancel",
      cls: "retrotagger-cancel-button"
    });
    
    cancelButton.addEventListener("click", () => {
      this.close();
    });
    
    // Add CSS for the RetroTagger UI
    this.addRetroTaggerStyles();
  }
  
  // Load Habitica keys from the glossary
  private async loadHabiticaKeys(): Promise<string[]> {
    const pluginFolder = ".obsidian/plugins/Habsiad";
    const glossaryFileName = "frontmatterGlossary.json";
    const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
    
    try {
      const data = await this.app.vault.adapter.read(glossaryPath);
      const glossaryMapping = JSON.parse(data);
      
      // Extract unique Habitica keys (values in the glossary mapping)
      const habiticaKeys = Object.values(glossaryMapping).filter(value => value !== "");
      return habiticaKeys as string[];
    } catch (error) {
      console.error("Error loading glossary:", error);
      return [];
    }
  }
  
  // Toggle item selection between Achievement, Daily, and None
  private toggleItemSelection(key: string) {
    const button = this.itemButtons[key];
    
    if (!this.selectedItems[key]) {
      // First click: Select as Achievement (blue)
      this.selectedItems[key] = "achievement";
      button.removeClass("retrotagger-item-daily");
      button.addClass("retrotagger-item-achievement");
    } else if (this.selectedItems[key] === "achievement") {
      // Second click: Change to Daily (green)
      this.selectedItems[key] = "daily";
      button.removeClass("retrotagger-item-achievement");
      button.addClass("retrotagger-item-daily");
    } else {
      // Third click: Deselect
      delete this.selectedItems[key];
      button.removeClass("retrotagger-item-achievement");
      button.removeClass("retrotagger-item-daily");
    }
    
    this.updateSummary();
  }
  
  // Update the summary section with selected items
  private updateSummary() {
    const achievementsList = this.contentEl.querySelector(".retrotagger-achievements-list") as HTMLElement;
    const dailiesList = this.contentEl.querySelector(".retrotagger-dailies-list") as HTMLElement;
    
    if (achievementsList) achievementsList.empty();
    if (dailiesList) dailiesList.empty();
    
    for (const [key, type] of Object.entries(this.selectedItems)) {
      if (type === "achievement" && achievementsList) {
        achievementsList.createEl("li", { text: key });
      } else if (type === "daily" && dailiesList) {
        dailiesList.createEl("li", { text: key });
      }
    }
  }
  
  // Render the selected items to the journal entry
  private async renderSelectedItems() {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("No file is currently open.");
        return;
      }
      
      let content = await this.app.vault.read(activeFile);
      
      // Group items by type
      const achievements: string[] = [];
      const dailies: string[] = [];
      
      for (const [key, type] of Object.entries(this.selectedItems)) {
        if (type === "achievement") {
          achievements.push(key);
        } else if (type === "daily") {
          dailies.push(key);
        }
      }
      
      // Create the new sections
      let newContent = "";
      
      // Check if the file already has the Achievements section
      const achievementsRegex = new RegExp(`## Achievements on ${this.journalDate}`);
      const hasAchievementsSection = achievementsRegex.test(content);
      
      // Check if the file already has the Completed Dailies section
      const dailiesRegex = /## Completed Dailies/;
      const hasCompletedDailiesSection = dailiesRegex.test(content);
      
      if (achievements.length > 0) {
        if (hasAchievementsSection) {
          // Append to existing Achievements section
          const achievementsSectionRegex = new RegExp(`(## Achievements on ${this.journalDate}[\\s\\S]*?)(?=\\n##|$)`);
          const match = content.match(achievementsSectionRegex);
          
          if (match) {
            const existingSection = match[1];
            const newSection = existingSection + "\n" + achievements.map(item => `* Habit clicked: ${item} - Positive: 1, Negative: 0`).join("\n");
            content = content.replace(existingSection, newSection);
          }
        } else {
          // Create new Achievements section
          newContent += `\n## Achievements on ${this.journalDate}\n`;
          newContent += achievements.map(item => `* Habit clicked: ${item} - Positive: 1, Negative: 0`).join("\n");
        }
      }
      
      if (dailies.length > 0) {
        if (hasCompletedDailiesSection) {
          // Append to existing Completed Dailies section
          const dailiesSectionRegex = /## Completed Dailies[\s\S]*?(?=\n##|$)/;
          const match = content.match(dailiesSectionRegex);
          
          if (match) {
            const existingSection = match[0];
            const newSection = existingSection + "\n" + dailies.map(item => `* ${item}`).join("\n");
            content = content.replace(existingSection, newSection);
          }
        } else {
          // Create new Completed Dailies section
          if (!hasAchievementsSection || achievements.length === 0) {
            newContent += "\n## Completed Dailies\n";
          } else {
            newContent += "\n\n## Completed Dailies\n";
          }
          newContent += dailies.map(item => `* ${item}`).join("\n");
        }
      }
      
      // If we didn't modify existing sections, append the new content
      if (!hasAchievementsSection && !hasCompletedDailiesSection && newContent) {
        content += newContent;
      }
      
      // Save the changes
      await this.app.vault.modify(activeFile, content);
      
      new Notice(`Successfully updated journal entry for ${this.journalDate}`);
    } catch (error) {
      console.error("Error rendering selected items:", error);
      new Notice("Error updating journal entry. See console for details.");
    }
  }
  
  // Add CSS styles for the RetroTagger UI
  private addRetroTaggerStyles() {
    const styles = document.createElement("style");
    styles.id = "retrotagger-styles";
    styles.textContent = `
      .retrotagger-container {
        padding: 16px;
      }
      
      .retrotagger-instructions {
        margin-bottom: 16px;
        padding: 8px;
        background-color: var(--background-secondary);
        border-radius: 4px;
      }
      
      .retrotagger-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .retrotagger-item {
        padding: 8px 12px;
        border-radius: 4px;
        background-color: var(--background-secondary);
        border: none;
        cursor: pointer;
      }
      
      .retrotagger-item-achievement {
        background-color: #3498db;
        color: white;
      }
      
      .retrotagger-item-daily {
        background-color: #2ecc71;
        color: white;
      }
      
      .retrotagger-summary {
        margin-bottom: 16px;
        padding: 8px;
        background-color: var(--background-secondary);
        border-radius: 4px;
      }
      
      .retrotagger-render-button,
      .retrotagger-cancel-button {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        margin-right: 8px;
      }
      
      .retrotagger-render-button {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .retrotagger-cancel-button {
        background-color: var(--background-modifier-error);
        color: white;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  onClose() {
    // Clean up styles
    const styleEl = document.getElementById("retrotagger-styles");
    if (styleEl) styleEl.remove();
    
    const { contentEl } = this;
    contentEl.empty();
  }
}

export default class HabsiadPlugin extends Plugin {
  public habiticaService!: HabiticaService;
  public settings: HabsiadSettings = DEFAULT_SETTINGS; // ✅ Ensures initialization

  async onload() {
    console.log("Loading Habsiad Plugin");

    // Load settings
    await this.loadSettings();

    // Initialize Habitica Service
    this.habiticaService = new HabiticaService(this);

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
      callback: () => this.generateHabitsAndDailies(),
      hotkeys: [this.settings.shortcuts.generateHabitsAndDailies],
    });

    // Register the command to replace {WEEKDAY} with the correct day (Manual Trigger)
    this.addCommand({
      id: "replace-weekday",
      name: "Replace {WEEKDAY} with Actual Day",
      callback: () => this.replaceWeekday(),
      hotkeys: [this.settings.shortcuts.replaceWeekday],
    });

    // Register the TODO-Sync command
    this.addCommand({
      id: "sync-todo",
      name: "Sync Habitica TODO",
      callback: () => this.syncTodo(),
      hotkeys: [this.settings.shortcuts.syncTodo],
    });

    // Register the Habitica to Frontmatter sync command
    this.addCommand({
      id: "sync-habitica-to-frontmatter",
      name: "Sync Habitica to Frontmatter",
      callback: () => this.syncHabiticaToFrontmatter(),
      hotkeys: [this.settings.shortcuts.syncHabiticaToFrontmatter],
    });
    
    // Register the Calculate Calorie Totals command
    this.addCommand({
      id: "calculate-calorie-totals",
      name: "Calculate Calorie Totals",
      callback: () => this.calculateCalorieTotals(),
      hotkeys: [this.settings.shortcuts.calculateCalorieTotals],
    });
    
    // Register the Retrotagger command
    this.addCommand({
      id: "open-retrotagger",
      name: "Open Retrotagger",
      callback: () => this.openRetrotagger(),
      hotkeys: [this.settings.shortcuts.openRetrotagger],
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
            this.replaceWeekday(file);
          }
        }
      })
    );
  }

  onunload() {
    console.log("Unloading Habsiad Plugin");
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_SIDEBAR);
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
  
  /**
   * Opens the RetroTagger modal for the current journal entry.
   * Allows users to retroactively add achievements and dailies to journal entries.
   */
  openRetrotagger() {
    const modal = new RetroTaggerModal(this.app, this);
    modal.open();
  }

  async generateHabitsAndDailies() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("Please open a Markdown file to insert Habitica data.");
      return;
    }

    const file = activeView.file;
    if (!file) {
      new Notice("No file is open. Please open a Markdown file.");
      return;
    }

    const journalFolderName = this.settings.journalFolderName || "Journal";
    if (
      !file.path.toLowerCase().startsWith(`${journalFolderName.toLowerCase()}/`)
    ) {
      new Notice(
        `This command can only be used in the ${journalFolderName} folder.`
      );
      return;
    }

    const fileNamePattern = /^\d{4}-\d{2}-\d{2}\.md$/;
    if (!fileNamePattern.test(file.name)) {
      new Notice("This command can only be used in daily journal notes.");
      return;
    }

    const { habiticaUserId, habiticaApiToken } = this.settings;
    if (!habiticaUserId || !habiticaApiToken) {
      new Notice(
        "Please enter your Habitica credentials in the Habsiad settings."
      );
      return;
    }

    await this.insertHabitsAndDailies(activeView);
  }

  async saveCustomFrontmatterName(key: string, value: string) {
    if (!this.settings.customFrontmatter) {
      this.settings.customFrontmatter = {};
    }
    this.settings.customFrontmatter[key] = value;
    await this.saveSettings();
  }

  getCustomFrontmatterName(key: string): string {
    return this.settings.customFrontmatter?.[key] || "";
  }

  async insertHabitsAndDailies(activeView: MarkdownView) {
    try {
      const tasks = await this.habiticaService.getTasks();

      const habitsOutput = tasks
        .filter(
          (task) =>
            task.type === "habit" &&
            (task.counterUp > 0 || task.counterDown > 0)
        )
        .map(
          (task) =>
            `* Habit clicked: ${task.text} - Positive: ${task.counterUp}, Negative: ${task.counterDown}`
        )
        .join("\n");

      const dailiesOutput = tasks
        .filter((task) => task.type === "daily" && task.completed)
        .map((task) => `* ${task.text}`)
        .join("\n");

      const today = window.moment().format("YYYY-MM-DD");
      const output = `## Achievements on ${today}\n${habitsOutput}\n\n## Completed Dailies\n${dailiesOutput}`;

      const editor = activeView.editor;
      editor.replaceRange(output, editor.getCursor());

      new Notice("Habits and Dailies inserted successfully.");
    } catch (error) {
      new Notice("Failed to fetch Habitica tasks. Check console for details.");
      console.error("Error fetching Habitica tasks:", error);
    }
  }

  /**
   * Updates the "steps" field inside the frontmatter of a journal entry.
   * If frontmatter exists, modifies the "steps" field.
   * If frontmatter is missing, adds it to the file.
   */
  async updateStepsFrontmatter(file: TFile, newSteps: string) {
    let content = await this.app.vault.read(file);

    // Locate frontmatter section
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    let newContent;

    if (match) {
      const frontmatterText = match[1];

      // Modify the "steps" value or insert if not found
      const updatedFrontmatter = frontmatterText
        .split("\n")
        .map((line) =>
          line.startsWith("steps:") ? `steps: ${newSteps}` : line
        )
        .join("\n");

      newContent = content.replace(
        frontmatterRegex,
        `---\n${updatedFrontmatter}\n---`
      );
    } else {
      // If no frontmatter exists, create it
      newContent = `---\nsteps: ${newSteps}\n---\n\n${content}`;
    }

    // Save the updated file
    await this.app.vault.modify(file, newContent);
  }
  
  /**
   * Updates the "weight" field inside the frontmatter of a journal entry.
   * If frontmatter exists, modifies the "weight" field.
   * If frontmatter is missing, adds it to the file.
   */
  async updateWeightFrontmatter(file: TFile, newWeight: string) {
    let content = await this.app.vault.read(file);

    // Locate frontmatter section
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    let newContent;

    if (match) {
      const frontmatterText = match[1];

      // Check if the "weight" field already exists
      const hasWeightField = frontmatterText.split("\n").some(line => 
        line.startsWith("weight:")
      );

      if (hasWeightField) {
        // Modify the existing "weight" value
        const updatedFrontmatter = frontmatterText
          .split("\n")
          .map((line) =>
            line.startsWith("weight:") ? `weight: ${newWeight}` : line
          )
          .join("\n");

        newContent = content.replace(
          frontmatterRegex,
          `---\n${updatedFrontmatter}\n---`
        );
      } else {
        // Add the "weight" field to the existing frontmatter
        const updatedFrontmatter = frontmatterText + `\nweight: ${newWeight}`;
        newContent = content.replace(
          frontmatterRegex,
          `---\n${updatedFrontmatter}\n---`
        );
      }
    } else {
      // If no frontmatter exists, create it
      newContent = `---\nweight: ${newWeight}\n---\n\n${content}`;
    }

    // Save the updated file
    await this.app.vault.modify(file, newContent);
  }
  
  /**
   * Updates the "calories" field inside the frontmatter of a journal entry.
   * If frontmatter exists, modifies the "calories" field.
   * If frontmatter is missing, adds it to the file.
   */
  async updateCaloriesFrontmatter(file: TFile, newCalories: string) {
    let content = await this.app.vault.read(file);

    // Locate frontmatter section
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);
    let newContent;

    if (match) {
      const frontmatterText = match[1];

      // Check if the "calories" field already exists
      const hasCaloriesField = frontmatterText.split("\n").some(line => 
        line.startsWith("calories:")
      );

      if (hasCaloriesField) {
        // Modify the existing "calories" value
        const updatedFrontmatter = frontmatterText
          .split("\n")
          .map((line) =>
            line.startsWith("calories:") ? `calories: ${newCalories}` : line
          )
          .join("\n");

        newContent = content.replace(
          frontmatterRegex,
          `---\n${updatedFrontmatter}\n---`
        );
      } else {
        // Add the "calories" field to the existing frontmatter
        const updatedFrontmatter = frontmatterText + `\ncalories: ${newCalories}`;
        newContent = content.replace(
          frontmatterRegex,
          `---\n${updatedFrontmatter}\n---`
        );
      }
    } else {
      // If no frontmatter exists, create it
      newContent = `---\ncalories: ${newCalories}\n---\n\n${content}`;
    }

    // Save the updated file
    await this.app.vault.modify(file, newContent);
  }
  
  /**
   * Calculates calorie totals by properly parsing the EST.CALORIES column in markdown tables
   * and updating the calories frontmatter key with the sum.
   */
  async calculateCalorieTotals() {
    const journalFolderName = this.settings.journalFolderName || "Journal";
    const journalFolder = this.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      new Notice(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    // Get all journal files with YYYY-MM-DD.md format
    const journalFiles = journalFolder.children
      .filter((file) => file instanceof TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/))
      .sort((a, b) => b.name.localeCompare(a.name)) as TFile[]; // Sort by date descending

    let filesProcessed = 0;
    let filesUpdated = 0;
    
    // Function to debug print a raw markdown table for inspection
    const debugPrintTable = (tableName: string, tableText: string) => {
      console.log(`\n--- ${tableName} ---`);
      console.log(tableText);
      console.log("-------------------\n");
    };

    for (const file of journalFiles) {
      filesProcessed++;
      const content = await this.app.vault.read(file);
      
      // Very specific approach: Look for a markdown table that has EST.CALORIES in the header
      // The crucial part is to properly parse the table structure with vertical bars
      // Start by looking at the content line by line, but preserve the exact format of each line
      const lines = content.split('\n');
      let foundCalorieTable = false;
      let calorieTableLines: string[] = [];
      let tableStartLine = 0;
      
      // First find a table with EST.CALORIES in the header
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for a header row that contains EST.CALORIES
        if (line.includes("EST.CALORIES") && line.startsWith("|") && line.endsWith("|")) {
          foundCalorieTable = true;
          tableStartLine = i;
          break;
        }
      }
      
      if (!foundCalorieTable) {
        // No calorie table found in this file
        console.log(`No table with EST.CALORIES found in ${file.name}`);
        continue;
      }
      
      // Now extract the complete table
      let tableEndLine = tableStartLine;
      for (let i = tableStartLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("|") && line.endsWith("|")) {
          calorieTableLines.push(line);
          tableEndLine = i;
        } else if (i > tableStartLine) {
          // We've reached the end of the table
          break;
        }
      }
      
      // Make sure we have a header and at least one data row
      if (calorieTableLines.length < 3) {
        console.log(`Table too short in ${file.name}, found ${calorieTableLines.length} lines`);
        continue;
      }
      
      const tableText = calorieTableLines.join('\n');
      debugPrintTable(`Table in ${file.name}`, tableText);
      
      // Parse the header to find the column index for EST.CALORIES
      const headerLine = calorieTableLines[0];
      const headerCells = headerLine.split('|').map(cell => cell.trim());
      
      // Find the index of the EST.CALORIES column (accounting for the empty cells at start/end)
      let estCaloriesColumnIndex = -1;
      for (let i = 0; i < headerCells.length; i++) {
        if (headerCells[i].toUpperCase() === 'EST.CALORIES') {
          estCaloriesColumnIndex = i;
          break;
        }
      }
      
      if (estCaloriesColumnIndex === -1) {
        console.log(`Could not find EST.CALORIES column in header: ${headerLine}`);
        continue;
      }
      
      console.log(`EST.CALORIES column is at index ${estCaloriesColumnIndex} in ${file.name}`);
      
      // Now process each data row (skipping header and separator)
      let totalCalories = 0;
      
      for (let i = 2; i < calorieTableLines.length; i++) {
        const dataLine = calorieTableLines[i];
        const dataCells = dataLine.split('|');
        
        // Ensure the array has enough elements to access the EST.CALORIES column
        if (dataCells.length <= estCaloriesColumnIndex) {
          console.log(`Row has insufficient columns: ${dataLine}`);
          continue;
        }
        
        // Get the actual cell content at the EST.CALORIES position
        const calorieCell = dataCells[estCaloriesColumnIndex].trim();
        
        console.log(`Processing cell: "${calorieCell}" in ${file.name}`);
        
        // Skip empty cells or cells with just whitespace
        if (!calorieCell || calorieCell === '') {
          console.log(`Empty calorie cell in row: ${dataLine}`);
          continue;
        }
        
        // Try to extract a number from the cell
        // This regex looks for one or more digits, ignoring any surrounding text
        const numberMatch = calorieCell.match(/\d+/);
        
        if (numberMatch) {
          const calories = parseInt(numberMatch[0], 10);
          if (!isNaN(calories) && calories > 0) {
            console.log(`Found ${calories} calories in ${file.name} at line ${tableStartLine + i}`);
            totalCalories += calories;
          }
        }
      }
      
      if (totalCalories > 0) {
        console.log(`Total calories in ${file.name}: ${totalCalories}`);
        // Update the frontmatter with the calculated total
        await this.updateCaloriesFrontmatter(file, totalCalories.toString());
        filesUpdated++;
      } else {
        console.log(`No valid calories found in ${file.name}`);
      }
    }
    
    if (filesUpdated > 0) {
      new Notice(`Updated calorie totals in ${filesUpdated} of ${filesProcessed} journal files.`);
    } else {
      new Notice(`No valid calorie data found. Checked ${filesProcessed} journal files.`);
    }
  }

  /**
   * Replaces {WEEKDAY} with the actual day of the week based on the filename.
   * Runs manually (via command) or automatically when a new file is created.
   */
  async replaceWeekday(file?: TFile) {
    // Get the active file if no specific file is passed
    if (!file) {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      file = activeView?.file ?? undefined;
    }

    // Ensure a valid TFile is provided
    if (!file) {
      new Notice("Please open a journal entry.");
      return;
    }

    // Check if the file matches the expected yyyy-mm-dd.md pattern
    const fileName = file.name;
    const match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
    if (!match) {
      new Notice("This is not a valid journal file.");
      return;
    }

    const [_, year, month, day] = match;
    const date = new Date(`${year}-${month}-${day}`);
    const weekday = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toUpperCase();

    // Read the file's content
    let content = await this.app.vault.read(file);

    // Handle frontmatter: Find where it ends (after the second "---")
    const frontmatterEnd = content.indexOf("---", 3); // Find the second "---"
    const bodyStartIndex = frontmatterEnd !== -1 ? frontmatterEnd + 3 : 0; // Skip past "---\n"
    const bodyContent = content.slice(bodyStartIndex);

    // Replace "# {WEEKDAY}" with the actual weekday
    const updatedBodyContent = bodyContent.replace(
      /^# \{WEEKDAY\}/m,
      `# ${weekday}`
    );

    // If no changes were made, notify the user and return
    if (bodyContent === updatedBodyContent) {
      new Notice("No changes were made; # {WEEKDAY} not found.");
      return;
    }

    // Reassemble the content (frontmatter + updated body)
    const updatedContent =
      content.slice(0, bodyStartIndex) + updatedBodyContent;

    // Save the updated content back to the file
    await this.app.vault.modify(file, updatedContent);
    new Notice(`Updated {WEEKDAY} to ${weekday}`);
  }

  /**
   * Syncs the TODO section of the active journal file with Habitica tasks.
   * - It verifies the file is in YYYY-MM-DD.md format.
   * - It locates the "### TODO:" header and determines the block boundaries.
   * - If the block is in its stock state (default tasks), it replaces it entirely.
   * - Otherwise, it merges new Habitica tasks with existing tasks without erasing them.
   */
  async syncTodo() {
    // Get the active file
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active file found.");
      return;
    }
    // Check that the file name is in the format YYYY-MM-DD.md
    if (!/^\d{4}-\d{2}-\d{2}\.md$/.test(activeFile.name)) {
      new Notice("This command only works on journal files (YYYY-MM-DD.md).");
      return;
    }

    // Read the file content
    let content = await this.app.vault.read(activeFile);
    const lines = content.split("\n");

    // Locate the TODO header; we expect a line exactly "### TODO:"
    let todoStart = -1;
    let todoEnd = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (/^### TODO:\s*$/.test(lines[i])) {
        todoStart = i;
        // Look for the next markdown header (line starting with '#' and a space)
        for (let j = i + 1; j < lines.length; j++) {
          if (/^#{1,6}\s/.test(lines[j])) {
            todoEnd = j;
            break;
          }
        }
        break;
      }
    }
    if (todoStart === -1) {
      new Notice("No TODO header found in this file.");
      return;
    }

    // Extract the current TODO block (including header)
    const currentTodoBlock = lines.slice(todoStart, todoEnd).join("\n");

    // Define the stock default block for comparison
    const defaultBlock = "### TODO:\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3";

    // Fetch Habitica TODO tasks using stored credentials
    const userId = this.settings.habiticaUserId;
    const apiToken = this.settings.habiticaApiToken;
    if (!userId || !apiToken) {
      new Notice("Habitica credentials are missing in settings.");
      return;
    }
    const apiUrl = "https://habitica.com/api/v3/tasks/user?type=todos";
    let response;
    try {
      response = await fetch(apiUrl, {
        headers: {
          "x-api-user": userId,
          "x-api-key": apiToken,
        },
      });
    } catch (err) {
      new Notice("Error fetching Habitica tasks.");
      console.error(err);
      return;
    }
    if (!response.ok) {
      new Notice("Failed to fetch tasks from Habitica.");
      return;
    }
    const data = await response.json();
    if (data.success !== true) {
      new Notice("Habitica API response unsuccessful.");
      return;
    }
    // Filter for incomplete TODO tasks
    const todos = data.data.filter((todo: any) => !todo.completed);

    // Build a Habitica tasks block string.
    let habiticaBlock = "";
    for (const todo of todos) {
      let line = `- [ ] ${todo.text}`;
      habiticaBlock += "\n" + line;
      if (todo.notes && todo.notes.trim().length > 0) {
        habiticaBlock += "\n    _" + todo.notes.trim() + "_";
      }
      if (
        todo.checklist &&
        Array.isArray(todo.checklist) &&
        todo.checklist.length > 0
      ) {
        for (const check of todo.checklist) {
          const checkLine = `- [${check.completed ? "x" : " "}] ${check.text}`;
          habiticaBlock += "\n    " + checkLine;
        }
      }
    }

    let newTodoBlock = "";
    // If the current TODO block exactly matches the stock default, replace it entirely.
    if (currentTodoBlock.trim() === defaultBlock.trim()) {
      newTodoBlock = "### TODO:" + habiticaBlock;
    } else {
      // Otherwise, merge Habitica tasks with existing tasks.
      // Preserve existing lines (which may include completed tasks or custom notes).
      const existingTaskLines = lines.slice(todoStart + 1, todoEnd);
      const mergedTasks = [...existingTaskLines];
      // For each Habitica task, if its text is not already present, append it.
      for (const todo of todos) {
        const exists = existingTaskLines.some((line) =>
          line.includes(todo.text)
        );
        if (!exists) {
          let newLine = `- [ ] ${todo.text}`;
          if (todo.notes && todo.notes.trim().length > 0) {
            newLine += "\n    _" + todo.notes.trim() + "_";
          }
          if (
            todo.checklist &&
            Array.isArray(todo.checklist) &&
            todo.checklist.length > 0
          ) {
            for (const check of todo.checklist) {
              const checkLine = `- [${check.completed ? "x" : " "}] ${
                check.text
              }`;
              newLine += "\n    " + checkLine;
            }
          }
          mergedTasks.push(newLine);
        }
      }
      newTodoBlock = "### TODO:\n" + mergedTasks.join("\n");
    }

    // Reconstruct the file content by replacing the old TODO block with the new one.
    const newContent = [
      ...lines.slice(0, todoStart),
      newTodoBlock,
      ...lines.slice(todoEnd),
    ].join("\n");

    await this.app.vault.modify(activeFile, newContent);
    new Notice("TODO section synced with Habitica tasks.");
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
    const journalFolder = this.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      new Notice(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    // Get the frontmatter glossary mapping
    const pluginFolder = ".obsidian/plugins/Habsiad";
    const glossaryFileName = "frontmatterGlossary.json";
    const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
    
    let glossaryMapping: { [key: string]: string } = {};
    try {
      const data = await this.app.vault.adapter.read(glossaryPath);
      glossaryMapping = JSON.parse(data);
    } catch (error) {
      new Notice("Could not read frontmatter glossary. Please set up glossary first.");
      console.error("Error reading glossary:", error);
      return;
    }

    // Create a reverse mapping (Habitica key -> frontmatter key)
    const reverseMapping: { [key: string]: string } = {};
    for (const [frontmatterKey, habiticaKey] of Object.entries(glossaryMapping)) {
      if (habiticaKey) {
        reverseMapping[habiticaKey] = frontmatterKey;
      }
    }

    // Process all journal files
    const filteredFiles = journalFolder.children
      .filter((file: TAbstractFile) => file instanceof TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)) as TFile[];
      
    const journalFiles = filteredFiles
      .sort((a: TFile, b: TFile) => b.name.localeCompare(a.name)); // Sort by date descending

    let filesProcessed = 0;
    let filesUpdated = 0;
    
    for (const file of journalFiles) {
      filesProcessed++;
      const content = await this.app.vault.read(file);
      
      // Check if the file has the required headers
      const achievementsHeaderRegex = /^## Achievements on \d{4}-\d{2}-\d{2}/m;
      const dailiesHeaderRegex = /^## Completed Dailies/m;
      
      if (!achievementsHeaderRegex.test(content) && !dailiesHeaderRegex.test(content)) {
        continue; // Skip this file if it doesn't have the required headers
      }
      
      // Extract the habit counter values and completed dailies from the content
      const habitCounters: { [key: string]: number } = {};
      const completedDailies: string[] = [];
      
      // Extract habit counters (e.g., "Habit clicked: Act of Love 💖 - Positive: 2, Negative: 0")
      const habitRegex = /\* Habit clicked: (.*?) - Positive: (\d+), Negative: (\d+)/g;
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
      const dailiesSection = content.match(/## Completed Dailies\n([\s\S]*?)(?=\n##|$)/);
      if (dailiesSection && dailiesSection[1]) {
        const dailiesList = dailiesSection[1].trim().split('\n');
        dailiesList.forEach(daily => {
          if (daily.startsWith('* ')) {
            completedDailies.push(daily.substring(2).trim());
          }
        });
      }
      
      // Update frontmatter based on glossary mapping
      let frontmatterUpdates: { [key: string]: number } = {};
      
      // Process habits based on Habitica keys in glossary
      for (const [habitName, netCount] of Object.entries(habitCounters)) {
        // Look through all Habitica keys to find a match
        for (const [habiticaKey, frontmatterKey] of Object.entries(reverseMapping)) {
          if (habitName.includes(habiticaKey)) {
            frontmatterUpdates[frontmatterKey] = netCount;
            break;
          }
        }
      }
      
      // Process dailies based on Habitica keys in glossary
      for (const dailyName of completedDailies) {
        for (const [habiticaKey, frontmatterKey] of Object.entries(reverseMapping)) {
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
      new Notice(`Updated frontmatter in ${filesUpdated} of ${filesProcessed} journal files.`);
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
      const frontmatterLines = frontmatterText.split('\n');
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
        `---\n${updatedLines.join('\n')}\n---`
      );
    } else {
      // If no frontmatter exists, create it
      const frontmatterLines = Object.entries(updates).map(([key, value]) => `${key}: ${value}`);
      newContent = `---\n${frontmatterLines.join('\n')}\n---\n\n${content}`;
    }
    
    // Save the updated file
    await this.app.vault.modify(file, newContent);
  }
}

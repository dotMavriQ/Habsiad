import { App, Editor, MarkdownView, Modal, TFile, Notice } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";
import {
  buildHabiticaBlock,
  extractHabiticaSections,
} from "../utils/journalSections";

/**
 * RetroTagger Modal - Allows users to add achievements and dailies to journal entries
 * This modal provides an interface for retroactively tagging journal entries with
 * Habitica data for completed habits and dailies.
 */
export class RetroTaggerModal extends Modal {
  private plugin: IHabsiadPlugin;
  private selectedItems: { [key: string]: string } = {}; // key -> "achievement" or "daily"
  private itemButtons: { [key: string]: HTMLElement } = {};
  private journalDate: string;

  constructor(app: App, plugin: IHabsiadPlugin) {
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
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const filePathLower = activeFile.path.toLowerCase();
    const journalFolderLower = journalFolderName.toLowerCase();

    if (!filePathLower.startsWith(`${journalFolderLower}/`)) {
      contentEl.createEl("div", {
        text: `This file is not in the ${journalFolderName} folder.`,
      });
      return;
    }

    const match = activeFile.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    if (!match) {
      contentEl.createEl("div", {
        text: "This file is not a valid journal entry (YYYY-MM-DD.md format required).",
      });
      return;
    }

    this.journalDate = match[1];

    // Create the main container for the retrotagger UI
    const mainContainer = contentEl.createDiv({ cls: "retrotagger-container" });

    // Add header
    mainContainer.createEl("h2", { text: `RetroTagger - ${this.journalDate}` });

    // Add instructions
    const instructionsDiv = mainContainer.createDiv({
      cls: "retrotagger-instructions",
    });
    instructionsDiv.createEl("p", {
      text: "Items already in this journal entry are pre-selected and highlighted.",
    });
    instructionsDiv.createEl("p", {
      text: "Click once on an item to add it to Achievements (blue).",
    });
    instructionsDiv.createEl("p", {
      text: "Click twice on an item to add it to Dailies (green).",
    });
    instructionsDiv.createEl("p", { text: "Click a third time to deselect." });

    // Create container for Habitica items
    const itemsContainer = mainContainer.createDiv({
      cls: "retrotagger-items",
    });

    // Load the glossary to get Habitica keys
    const habiticaKeys = await this.loadHabiticaKeys();

    // Create buttons for each Habitica item
    for (const habiticaKey of habiticaKeys) {
      if (!habiticaKey) continue;

      const itemButton = itemsContainer.createEl("button", {
        text: habiticaKey,
        cls: "retrotagger-item",
      });

      this.itemButtons[habiticaKey] = itemButton;

      itemButton.addEventListener("click", () => {
        this.toggleItemSelection(habiticaKey);
      });
    }

    // Load existing achievements and dailies from the current file
    await this.loadExistingEntries(activeFile);

    // Create the "Preview" section to show what will be added
    const summaryContainer = mainContainer.createDiv({
      cls: "retrotagger-summary",
    });
    summaryContainer.createEl("h3", { text: "Preview" });

    const achievementsDiv = summaryContainer.createDiv({
      cls: "retrotagger-achievements",
    });
    achievementsDiv.createEl("h4", {
      text: `Achievements on ${this.journalDate}`,
      cls: "retrotagger-preview-header",
    });
    const achievementsList = achievementsDiv.createEl("ul", {
      cls: "retrotagger-achievements-list",
    });

    const dailiesDiv = summaryContainer.createDiv({
      cls: "retrotagger-dailies",
    });
    dailiesDiv.createEl("h4", {
      text: "Completed Dailies",
      cls: "retrotagger-preview-header",
    });
    const dailiesList = dailiesDiv.createEl("ul", {
      cls: "retrotagger-dailies-list",
    });

    // Update summary to show loaded existing entries
    this.updateSummary();

    // Add the "RetroTag" button
    const renderButton = mainContainer.createEl("button", {
      text: "RetroTag",
      cls: "retrotagger-render-button",
    });

    renderButton.addEventListener("click", async () => {
      await this.renderSelectedItems();
      this.close();
    });

    // Add "Cancel" button
    const cancelButton = mainContainer.createEl("button", {
      text: "Cancel",
      cls: "retrotagger-cancel-button",
    });

    cancelButton.addEventListener("click", () => {
      this.close();
    });

    // Add CSS for the RetroTagger UI
    this.addRetroTaggerStyles();
  }

  // Load Habitica keys from the glossary
  private async loadHabiticaKeys(): Promise<string[]> {
    const pluginFolder = this.plugin.getPluginDir();
    const glossaryFileName = "frontmatterGlossary.json";
    const glossaryPath = `${pluginFolder}/${glossaryFileName}`;

    try {
      const data = await this.app.vault.adapter.read(glossaryPath);
      const glossaryMapping = JSON.parse(data);

      // Extract unique Habitica keys, handling both old and new format
      let habiticaKeys: string[] = [];
      for (const value of Object.values(glossaryMapping)) {
        if (typeof value === "string") {
          // Old format: string values
          if (value !== "") habiticaKeys.push(value);
        } else if (typeof value === "object" && value !== null) {
          // New format: object with habiticaKey property
          const entry = value as { habiticaKey?: string; isDisabled?: boolean };
          if (
            entry.habiticaKey &&
            entry.habiticaKey !== "" &&
            !entry.isDisabled
          ) {
            habiticaKeys.push(entry.habiticaKey);
          }
        }
      }
      return habiticaKeys;
    } catch (error) {
      console.error("Error loading glossary:", error);
      return [];
    }
  }

  // Load existing achievements and dailies from the current file
  private async loadExistingEntries(file: TFile) {
    try {
      const content = await this.app.vault.read(file);

      // Parse existing achievements
      const achievementsRegex = new RegExp(
        `## Achievements on ${this.journalDate}([\\s\\S]*?)(?=\\n##|$)`
      );
      const achievementsMatch = content.match(achievementsRegex);

      if (achievementsMatch) {
        const achievementsSection = achievementsMatch[1];
        // Look for lines like "* HABIT_NAME - Positive: 1, Negative: 0"
        const habitLines = achievementsSection.match(/\* (.+?) - Positive:/g);

        if (habitLines) {
          for (const line of habitLines) {
            const habitMatch = line.match(/\* (.+?) - Positive:/);
            if (habitMatch) {
              const habitName = habitMatch[1].trim();
              if (this.itemButtons[habitName]) {
                this.selectedItems[habitName] = "achievement";
                this.itemButtons[habitName].addClass(
                  "retrotagger-item-achievement"
                );
              }
            }
          }
        }
      }

      // Parse existing completed dailies
      const dailiesRegex = /## Completed Dailies([\s\S]*?)(?=\n##|$)/;
      const dailiesMatch = content.match(dailiesRegex);

      if (dailiesMatch) {
        const dailiesSection = dailiesMatch[1];
        // Look for lines like "* DAILY_NAME"
        const dailyLines = dailiesSection.match(/^\* (.+)$/gm);

        if (dailyLines) {
          for (const line of dailyLines) {
            const dailyMatch = line.match(/^\* (.+)$/);
            if (dailyMatch) {
              const dailyName = dailyMatch[1].trim();
              // Skip habit lines that might be in the dailies section
              if (
                !dailyName.includes(" - Positive:") &&
                this.itemButtons[dailyName]
              ) {
                this.selectedItems[dailyName] = "daily";
                this.itemButtons[dailyName].addClass("retrotagger-item-daily");
              }
            }
          }
        }
      }

      // Note: updateSummary() will be called after the summary container is created
    } catch (error) {
      console.error("Error loading existing entries:", error);
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
    const achievementsList = this.contentEl.querySelector(
      ".retrotagger-achievements-list"
    ) as HTMLElement;
    const dailiesList = this.contentEl.querySelector(
      ".retrotagger-dailies-list"
    ) as HTMLElement;

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

  // Find the open editor for a file so writes update the view immediately
  // (vault.modify on an open note can leave the editor showing stale text).
  private getOpenEditor(file: TFile): Editor | null {
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (view instanceof MarkdownView && view.file?.path === file.path) {
        return view.editor;
      }
    }
    return null;
  }

  // Render the selected items to the journal entry, consolidating the two
  // Habitica sections at the bottom of the note.
  private async renderSelectedItems() {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) {
        new Notice("No file is currently open.");
        return;
      }

      const content = await this.app.vault.read(activeFile);

      // Pull out whatever achievements/dailies already exist (in their proper,
      // line-anchored sections) so we can merge rather than duplicate.
      const { body, achievements, dailies } = extractHabiticaSections(
        content,
        this.journalDate
      );

      const achievementNames = achievements.map((line) =>
        line.split(/\s+-\s+Positive:/)[0].trim()
      );

      let added = 0;
      for (const [key, type] of Object.entries(this.selectedItems)) {
        if (type === "achievement") {
          if (!achievementNames.includes(key)) {
            achievements.push(`${key} - Positive: 1, Negative: 0`);
            achievementNames.push(key);
            added++;
          }
        } else if (type === "daily") {
          if (!dailies.includes(key)) {
            dailies.push(key);
            added++;
          }
        }
      }

      if (achievements.length === 0 && dailies.length === 0) {
        new Notice("Nothing selected to add.");
        return;
      }

      const block = buildHabiticaBlock(this.journalDate, achievements, dailies);
      const newContent = body.length ? `${body}\n\n${block}\n` : `${block}\n`;

      const editor = this.getOpenEditor(activeFile);
      if (editor) {
        editor.setValue(newContent);
      } else {
        await this.app.vault.modify(activeFile, newContent);
      }

      if (added > 0) {
        new Notice(
          `RetroTagged ${this.journalDate}: added ${added} item${
            added === 1 ? "" : "s"
          } at the bottom of the note.`
        );
      } else {
        new Notice(
          `Journal entry for ${this.journalDate} already contains all selected items.`
        );
      }
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
        padding: 10px 14px;
        min-height: 40px;
        border-radius: 4px;
        background-color: var(--background-secondary);
        border: none;
        cursor: pointer;
        font-size: 14px;
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
      
      .retrotagger-preview-header {
        color: #fabd2f;
        margin-top: 12px;
        margin-bottom: 8px;
      }
      
      .retrotagger-render-button,
      .retrotagger-cancel-button {
        padding: 10px 18px;
        min-height: 40px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        margin-right: 8px;
        margin-top: 8px;
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

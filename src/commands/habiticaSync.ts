import { MarkdownView, Notice, TFile } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";

/**
 * Habitica Synchronization Command Handler
 * Handles generating and inserting Habitica habits and dailies into journal entries
 */
export class HabiticaSyncCommand {
  private plugin: IHabsiadPlugin;

  constructor(plugin: IHabsiadPlugin) {
    this.plugin = plugin;
  }

  /**
   * Main command to generate and insert habits and dailies
   * Validates the current context and delegates to insertion
   */
  async generateHabitsAndDailies() {
    const activeView =
      this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice("Please open a Markdown file to insert Habitica data.");
      return;
    }

    const file = activeView.file;
    if (!file) {
      new Notice("No file is open. Please open a Markdown file.");
      return;
    }

    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
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

    const { habiticaUserId, habiticaApiToken } = this.plugin.settings;
    if (!habiticaUserId || !habiticaApiToken) {
      new Notice(
        "Please enter your Habitica credentials in the Habsiad settings."
      );
      return;
    }

    await this.insertHabitsAndDailies(activeView);
  }

  /**
   * Fetches Habitica data and inserts formatted habits and dailies into the current note
   */
  async insertHabitsAndDailies(activeView: MarkdownView) {
    try {
      const tasks = await this.plugin.habiticaService.getTasks();

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
}

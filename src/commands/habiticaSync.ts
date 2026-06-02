import { MarkdownView, Notice, TFile } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";
import { withSectionsAtBottom } from "../utils/journalSections";

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

      const achievements = tasks
        .filter(
          (task) =>
            task.type === "habit" &&
            (task.counterUp > 0 || task.counterDown > 0)
        )
        .map(
          (task) =>
            `${task.text} - Positive: ${task.counterUp}, Negative: ${task.counterDown}`
        );

      const dailies = tasks
        .filter((task) => task.type === "daily" && task.completed)
        .map((task) => task.text);

      // Use the date of the journal file being written into, not the current
      // system date. The filename is validated as YYYY-MM-DD.md upstream, so
      // its basename is the correct date even when editing past midnight or
      // backfilling an older day. (Fixes #17, #18)
      const journalDate =
        activeView.file?.basename ?? window.moment().format("YYYY-MM-DD");

      // Always rebuild the sections at the bottom of the note (replacing any
      // existing copy for this date) instead of dumping them at the cursor.
      const editor = activeView.editor;
      editor.setValue(
        withSectionsAtBottom(editor.getValue(), journalDate, achievements, dailies)
      );

      new Notice("Habits and Dailies inserted successfully.");
    } catch (error) {
      new Notice("Failed to fetch Habitica tasks. Check console for details.");
      console.error("Error fetching Habitica tasks:", error);
    }
  }
}

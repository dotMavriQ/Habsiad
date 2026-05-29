import { MarkdownView, Notice, TFile } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";
import type { HabiticaUserData } from "../habitica/types/user";

/**
 * Utility Commands Handler
 * Handles text processing utilities and specialized sync operations
 */
export class UtilityCommands {
  private plugin: IHabsiadPlugin;

  constructor(plugin: IHabsiadPlugin) {
    this.plugin = plugin;
  }

  /**
   * Replace {WEEKDAY} placeholder with actual weekday name in journal files
   */
  async replaceWeekday(file?: TFile) {
    // Get the active file if no specific file is passed
    if (!file) {
      const activeView =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
      file = activeView?.file ?? undefined;
    }

    // Ensure a valid TFile is provided
    if (!file) {
      new Notice("Please open a journal entry.");
      return;
    }

    // Check if the file matches the expected yyyy-mm-dd.md pattern
    const fileName = file.name;
    const match = fileName.match(/^(\\d{4})-(\\d{2})-(\\d{2})\\.md$/);
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
    let content = await this.plugin.app.vault.read(file);

    // Handle frontmatter: Find where it ends (after the second "---")
    const frontmatterEnd = content.indexOf("---", 3); // Find the second "---"
    const bodyStartIndex = frontmatterEnd !== -1 ? frontmatterEnd + 3 : 0; // Skip past "---\\n"
    const bodyContent = content.slice(bodyStartIndex);

    // Replace "# {WEEKDAY}" with the actual weekday
    const updatedBodyContent = bodyContent.replace(
      /^# \\{WEEKDAY\\}/m,
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
    await this.plugin.app.vault.modify(file, updatedContent);
    new Notice(`Updated {WEEKDAY} to ${weekday}`);
  }

  /**
   * Syncs the TODO section of the active journal file with Habitica tasks.
   * - It verifies the file is in YYYY-MM-DD.md format.
   * - It locates the "### TODO:" header and determines the block boundaries.
   */
  async syncTodo() {
    // Get the active file
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active file found.");
      return;
    }
    // Check that the file name is in the format YYYY-MM-DD.md
    if (!/^\\d{4}-\\d{2}-\\d{2}\\.md$/.test(activeFile.name)) {
      new Notice("This command only works on journal files (YYYY-MM-DD.md).");
      return;
    }

    // Read the file content
    let content = await this.plugin.app.vault.read(activeFile);
    const lines = content.split("\\n");

    // Locate the TODO header; we expect a line exactly "### TODO:"
    let todoStart = -1;
    let todoEnd = lines.length;
    for (let i = 0; i < lines.length; i++) {
      if (/^### TODO:\\s*$/.test(lines[i])) {
        todoStart = i;
        // Look for the next markdown header (line starting with '#' and a space)
        for (let j = i + 1; j < lines.length; j++) {
          if (/^#{1,6}\\s/.test(lines[j])) {
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
    const currentTodoBlock = lines.slice(todoStart, todoEnd).join("\\n");

    // Define the stock default block for comparison
    const defaultBlock =
      "### TODO:\\n- [ ] Task 1\\n- [ ] Task 2\\n- [ ] Task 3";

    // Fetch Habitica TODO tasks using the service
    let todos;
    try {
      todos = await this.plugin.habiticaService.getTodos();
    } catch (error) {
      new Notice("Failed to fetch Habitica TODOs. Check console for details.");
      console.error("Error fetching Habitica TODOs:", error);
      return;
    }

    if (todos.length === 0) {
      new Notice("No incomplete TODOs found in Habitica.");
      return;
    }

    // Build a new TODO block from Habitica TODOs
    const newTodoBlock = ["### TODO:"]
      .concat(todos.map((todo) => `- [ ] ${todo.text}`))
      .join("\\n");

    // Check if the current block is the default; if so, replace unconditionally
    const isDefault = currentTodoBlock.trim() === defaultBlock.trim();

    // Check if there are any differences to the current block
    const isDifferent = currentTodoBlock.trim() !== newTodoBlock.trim();

    if (!isDefault && !isDifferent) {
      new Notice("TODO section is already up to date.");
      return;
    }

    // If it's not the default and it's different, ask for confirmation
    if (!isDefault && isDifferent) {
      const userWantsToReplace = confirm(
        "The TODO section has custom content. Do you want to replace it with Habitica TODOs?"
      );
      if (!userWantsToReplace) {
        new Notice("TODO sync cancelled.");
        return;
      }
    }

    // Replace the TODO block
    const newLines = [
      ...lines.slice(0, todoStart),
      ...newTodoBlock.split("\\n"),
      ...lines.slice(todoEnd),
    ];
    const newContent = newLines.join("\\n");

    // Save the updated file
    await this.plugin.app.vault.modify(activeFile, newContent);
    new Notice(`TODO section updated with ${todos.length} Habitica tasks.`);
  }

  /**
   * Sync basic Habitica stats to frontmatter (simple version)
   * Updates frontmatter fields with current Habitica user data
   */
  async syncBasicHabiticaStats() {
    const activeFile = this.plugin.app.workspace.getActiveFile();
    if (!activeFile) {
      new Notice("No active file found.");
      return;
    }

    try {
      // Fetch user data from Habitica
      const userData = await this.plugin.habiticaService.getUserData();

      if (!userData?.stats) {
        new Notice("Failed to fetch Habitica user data.");
        return;
      }

      // Get current content
      let content = await this.plugin.app.vault.read(activeFile);

      // Update frontmatter with Habitica stats
      const frontmatterRegex = /^---\\n([\\s\\S]*?)\\n---/;
      const match = content.match(frontmatterRegex);

      const habiticaData = {
        habitica_hp: userData.stats.hp?.toFixed(1) || "0",
        habitica_mp: userData.stats.mp?.toFixed(1) || "0",
        habitica_exp: userData.stats.exp?.toFixed(0) || "0",
        habitica_gold: userData.stats.gp?.toFixed(0) || "0",
        habitica_level: userData.stats.lvl?.toString() || "1",
      };

      let newContent;
      if (match) {
        // Update existing frontmatter
        let frontmatterText = match[1];

        // Update each field
        Object.entries(habiticaData).forEach(([key, value]) => {
          const fieldRegex = new RegExp(`^${key}:.*$`, "m");
          if (fieldRegex.test(frontmatterText)) {
            frontmatterText = frontmatterText.replace(
              fieldRegex,
              `${key}: ${value}`
            );
          } else {
            frontmatterText += `\\n${key}: ${value}`;
          }
        });

        newContent = content.replace(
          frontmatterRegex,
          `---\\n${frontmatterText}\\n---`
        );
      } else {
        // Create new frontmatter
        const frontmatterLines = Object.entries(habiticaData)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\\n");
        newContent = `---\\n${frontmatterLines}\\n---\\n\\n${content}`;
      }

      await this.plugin.app.vault.modify(activeFile, newContent);
      new Notice("Habitica data synced to frontmatter successfully.");
    } catch (error) {
      new Notice("Failed to sync Habitica data. Check console for details.");
      console.error("Error syncing Habitica to frontmatter:", error);
    }
  }
}

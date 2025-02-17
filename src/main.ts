import {
  App,
  Plugin,
  Notice,
  TFile,
  MarkdownView,
  WorkspaceLeaf,
} from "obsidian";
import { HabiticaService } from "./habitica/habiticaService";
import { SidebarView, VIEW_TYPE_SIDEBAR } from "./views/sidebarView";
import {
  ObsiticaSettingTab,
  DEFAULT_SETTINGS,
  ObsiticaSettings,
} from "./settings";

export default class ObsiticaPlugin extends Plugin {
  public habiticaService!: HabiticaService;
  public settings: ObsiticaSettings = DEFAULT_SETTINGS; // ✅ Ensures initialization

  async onload() {
    console.log("Loading Obsitica Plugin");

    // Load settings
    await this.loadSettings();

    // Initialize Habitica Service
    this.habiticaService = new HabiticaService(this);

    // Add settings tab
    this.addSettingTab(new ObsiticaSettingTab(this.app, this));

    // Register the sidebar view
    this.registerView(
      VIEW_TYPE_SIDEBAR,
      (leaf: WorkspaceLeaf) => new SidebarView(leaf, this)
    );

    // Activate the sidebar view
    this.app.workspace.onLayoutReady(() => {
      this.activateSidebar();
    });

    // Register Habitica command
    this.addCommand({
      id: "generate-habits-and-dailies",
      name: "Generate Habits & Dailies",
      callback: () => this.generateHabitsAndDailies(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "H",
        },
      ],
    });

    // Register the command to replace {WEEKDAY} with the correct day (Manual Trigger)
    this.addCommand({
      id: "replace-weekday",
      name: "Replace {WEEKDAY} with Actual Day",
      callback: () => this.replaceWeekday(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "D",
        },
      ],
    });

    // Register the TODO-Sync command with Ctrl+Shift+Y
    this.addCommand({
      id: "sync-todo",
      name: "Sync Habitica TODO",
      callback: () => this.syncTodo(),
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "Y",
        },
      ],
    });

    // Automatically replace {WEEKDAY} when a new file is created in the JOURNAL folder
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        if (!(file instanceof TFile)) return;

        const journalFolderName = this.settings.journalFolderName || "Journal";
        if (file.path.startsWith(`${journalFolderName}/`)) {
          this.replaceWeekday(file);
        }
      })
    );
  }

  onunload() {
    console.log("Unloading Obsitica Plugin");
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
        "Please enter your Habitica credentials in the Obsitica settings."
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
}

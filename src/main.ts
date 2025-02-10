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
  public settings!: ObsiticaSettings;

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

  async getCustomFrontmatterName(key: string): Promise<string> {
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
}

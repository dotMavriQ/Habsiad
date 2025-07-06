import { App, TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

export interface AlcoholEntry {
  dateString: string;
  file: TFile;
  alcoholEmojis: string[];
}

export class AlcoholTab {
  private app: App;
  private plugin: HabsiadPlugin;

  constructor(app: App, plugin: HabsiadPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async render(container: HTMLElement): Promise<void> {
    container.empty();

    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      container.createEl("p", {
        text: `Journal folder "${journalFolderName}" not found.`,
        cls: "habsiad-error-message",
      });
      return;
    }

    container.createEl("h3", { text: "Alcohol Tracking" });

    const alcoholEntries = await this.scanForAlcoholEntries(journalFolder);

    if (alcoholEntries.length === 0) {
      container.createEl("p", {
        text: "No alcohol entries found in your journal.",
        cls: "habsiad-no-data",
      });
      return;
    }

    const table = container.createEl("table", { cls: "habsiad-alcohol-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Date" });
    headerRow.createEl("th", { text: "Alcohol Consumption" });

    const tbody = table.createEl("tbody");

    for (const entry of alcoholEntries) {
      const row = tbody.createEl("tr", { cls: "habsiad-clickable-row" });

      const dateCell = row.createEl("td");
      dateCell.createEl("span", {
        text: entry.dateString.replace(/-/g, "/"),
        cls: "habsiad-date-link",
      });

      const alcoholCell = row.createEl("td");
      alcoholCell.createEl("span", {
        text: entry.alcoholEmojis.join(" "),
        cls: "habsiad-alcohol-emojis",
      });

      // Make the row clickable
      row.addEventListener("click", () => {
        this.openJournalEntry(entry.file);
      });
    }
  }

  private async scanForAlcoholEntries(
    journalFolder: TFolder
  ): Promise<AlcoholEntry[]> {
    // List of alcohol-related emojis
    const alcoholEmojiList = [
      "🍺",
      "🍻",
      "🍷",
      "🍸",
      "🍹",
      "🥂",
      "🍾",
      "🥃",
      "🍶",
    ];

    const files = journalFolder.children.filter(
      (f) => f instanceof TFile && f.extension === "md"
    ) as TFile[];

    const alcoholEntries: AlcoholEntry[] = [];

    for (const file of files) {
      const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
      if (!match) continue;

      const [_, year, month, day] = match;
      const dateString = `${year}-${month}-${day}`;

      try {
        const content = await this.app.vault.read(file);
        const foundEmojis = this.extractAlcoholEmojis(
          content,
          alcoholEmojiList
        );

        if (foundEmojis.length > 0) {
          alcoholEntries.push({
            dateString,
            file,
            alcoholEmojis: foundEmojis,
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }

    // Sort entries by date (newest first)
    alcoholEntries.sort((a, b) => {
      if (a.dateString > b.dateString) return -1;
      if (a.dateString < b.dateString) return 1;
      return 0;
    });

    return alcoholEntries;
  }

  private extractAlcoholEmojis(
    content: string,
    alcoholEmojiList: string[]
  ): string[] {
    const foundEmojis: string[] = [];

    // Split content into lines for easier processing
    const lines = content.split("\n");
    let inReflectionsSection = false;
    let reflectionsContent = "";

    for (const line of lines) {
      // Check if we're starting a reflections section
      if (line.match(/^###+?\s*Reflections\s*:?\s*$/i)) {
        inReflectionsSection = true;
        continue;
      }

      // Check if we're hitting another section (stop collecting)
      if (inReflectionsSection && line.match(/^###+?\s*\w+/)) {
        break;
      }

      // Collect content if we're in reflections section
      if (inReflectionsSection) {
        reflectionsContent += line + "\n";
      }
    }

    // If we found reflections content, extract emojis
    if (reflectionsContent.trim()) {
      console.log("Found reflections content:", reflectionsContent);

      // Find all alcohol emojis in the order they appear in the text
      const allMatches: Array<{ emoji: string; index: number }> = [];

      for (const emoji of alcoholEmojiList) {
        const regex = new RegExp(emoji, "g");
        let match;
        while ((match = regex.exec(reflectionsContent)) !== null) {
          allMatches.push({
            emoji: emoji,
            index: match.index,
          });
        }
      }

      // Sort by index to maintain the order they appear in the text
      allMatches.sort((a, b) => a.index - b.index);

      // Extract just the emojis in order
      foundEmojis.push(...allMatches.map((match) => match.emoji));

      console.log("Found alcohol emojis:", foundEmojis);
    }

    return foundEmojis;
  }

  private async openJournalEntry(file: TFile): Promise<void> {
    const leaf = this.app.workspace.getUnpinnedLeaf();
    await leaf.openFile(file);
  }
}

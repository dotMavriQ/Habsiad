import { App, TFolder, TFile } from "obsidian";
import ObsiticaPlugin from "../../main"; // Import plugin to access settings

export class DataQualityDiagnosticsView {
  private app: App;
  private plugin: ObsiticaPlugin;

  constructor(app: App, plugin: ObsiticaPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async render(): Promise<HTMLElement> {
    const container = document.createElement("div");
    container.classList.add("data-quality-diagnostics");

    const table = document.createElement("table");
    table.classList.add("obsitica-diagnostics-table");

    // Table header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["DATE", "⭐", "🔨"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    const journalFolder = this.getJournalFolder();
    if (journalFolder) {
      const files = this.getJournalFiles(journalFolder);
      for (const file of files) {
        if (!(file instanceof TFile)) continue; // Ensure it's a file

        const row = tbody.insertRow();

        // Date Cell (Column A)
        const dateCell = row.insertCell();
        const dateLink = document.createElement("a");
        dateLink.textContent = file.basename.replace(".md", ""); // Display date only
        dateLink.href = "#";
        dateLink.style.textDecoration = "none";
        dateLink.style.color = "inherit";
        dateLink.onclick = (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(file.path, "", true);
        };
        dateCell.appendChild(dateLink);

        // Star Cell (Column B) - Checks for H5 Headers
        const h5Cell = row.insertCell();
        const h5Text = await this.extractH5Text(file);
        if (h5Text) {
          const starLink = document.createElement("a");
          starLink.textContent = "⭐";
          starLink.href = "#";
          starLink.title = h5Text; // Tooltip with extracted H5 content
          starLink.style.textDecoration = "none";
          starLink.style.cursor = "pointer";
          starLink.onclick = (e) => {
            e.preventDefault();
            this.app.workspace.openLinkText(file.path, "", true);
          };
          h5Cell.appendChild(starLink);
        }

        // Work Status Cell (Column C)
        const workCell = row.insertCell();
        const fileContent = await this.app.vault.read(file);
        const hasWorkHeader = fileContent.includes("## WORK:");
        const firstHeaderMatch = fileContent.match(/^# (.+)$/m);
        const firstHeader = firstHeaderMatch
          ? firstHeaderMatch[1].trim().toUpperCase()
          : "";
        const isWeekend =
          firstHeader === "SATURDAY" || firstHeader === "SUNDAY";

        if (isWeekend && hasWorkHeader) {
          workCell.textContent = "❌"; // Work logged on weekend
        } else if (hasWorkHeader) {
          workCell.textContent = "🔨"; // Workday
        } else if (h5Text) {
          workCell.textContent = "😃"; // Vacation/Holiday
        } else {
          workCell.textContent = "😌"; // Weekend
        }
      }
    }

    container.appendChild(table);
    return container;
  }

  private getJournalFolder(): TFolder | null {
    const folderName = this.plugin.settings.journalFolderName || "Journal"; // Use dynamic folder name from settings
    const folder = this.app.vault.getAbstractFileByPath(folderName);
    return folder instanceof TFolder ? folder : null;
  }

  private getJournalFiles(folder: TFolder): TFile[] {
    return folder.children
      .filter((f) => f instanceof TFile && f.extension === "md") // Ensure only TFiles
      .map((f) => f as TFile) // Cast safely
      .sort((a, b) => a.basename.localeCompare(b.basename)); // Sort by filename
  }

  private async extractH5Text(file: TFile): Promise<string | null> {
    const content = await this.app.vault.read(file);
    const match = content.match(/# .+?\n([\s\S]*?)\n## LIFE:/);
    if (!match) return null;

    const h5Lines = match[1]
      .split("\n")
      .filter((line) => line.startsWith("##### ") && !line.startsWith("######")) // Ensure exactly 5 hashes
      .map((line) => line.replace("##### ", "").trim()); // Remove the hashes for tooltip text

    return h5Lines.length > 0 ? h5Lines.join(" ") : null;
  }
}

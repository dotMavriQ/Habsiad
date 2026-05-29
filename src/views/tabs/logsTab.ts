import { TFile, TFolder } from "obsidian";
import type HabsiadPlugin from "../../main";

interface LogData {
  type: string;
  count: number;
  entries: Array<{
    fileName: string;
    date: string;
    filePath: string;
    title: string;
    content: string;
    hasImage: boolean;
    imagePath?: string;
  }>;
}

export class LogsTab {
  private plugin: HabsiadPlugin;
  private container: HTMLElement;
  private currentView: "overview" | "detail" = "overview";
  private selectedLog: LogData | null = null;

  constructor(plugin: HabsiadPlugin, container: HTMLElement) {
    this.plugin = plugin;
    this.container = container;
  }

  async render() {
    this.container.empty();

    if (this.currentView === "overview") {
      await this.renderOverview();
    } else if (this.currentView === "detail" && this.selectedLog) {
      this.renderDetailView(this.selectedLog);
    }
  }

  private async renderOverview() {
    // Create header
    const header = this.container.createDiv({ cls: "tab-header" });
    header.createEl("h3", { text: "📔 Logs" });

    // Create loading indicator
    const loadingDiv = this.container.createDiv({ cls: "loading-indicator" });
    loadingDiv.createEl("p", { text: "Scanning journal files for logs..." });

    try {
      // Scan for logs
      const logs = await this.scanForLogs();

      // Remove loading indicator
      loadingDiv.remove();

      if (logs.length === 0) {
        const noDataDiv = this.container.createDiv({ cls: "no-data" });
        noDataDiv.createEl("p", { text: "No logs found in journal files." });
        return;
      }

      // Create logs grid
      const logsGrid = this.container.createDiv({ cls: "logs-grid" });

      // Sort logs by count (descending) and then alphabetically
      logs.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.type.localeCompare(b.type);
      });

      // Create buttons for each log type
      for (const log of logs) {
        const logButton = logsGrid.createEl("button", {
          cls: "log-button",
          title: `${log.type} - Found ${log.count} entries`,
        });

        // Add type name (in bold caps) and count
        const typeSpan = logButton.createSpan({ cls: "log-type" });
        typeSpan.textContent = log.type.toUpperCase();

        const countSpan = logButton.createSpan({ cls: "log-count" });
        countSpan.textContent = `(${log.count})`;

        // Click handler to show detailed view
        logButton.addEventListener("click", () => {
          this.selectedLog = log;
          this.currentView = "detail";
          this.render();
        });
      }

      // Add summary
      const summaryDiv = this.container.createDiv({ cls: "logs-summary" });
      summaryDiv.createEl("p", {
        text: `Found ${logs.length} log types across all journal files.`,
        cls: "summary-text",
      });
    } catch (error) {
      loadingDiv.remove();
      console.error("Error scanning for logs:", error);

      const errorDiv = this.container.createDiv({ cls: "error-message" });
      errorDiv.createEl("p", {
        text: "Error scanning journal files. Check console for details.",
      });
    }
  }

  private renderDetailView(log: LogData) {
    // Create header with back button
    const header = this.container.createDiv({ cls: "tab-header" });
    const titleContainer = header.createDiv({ cls: "detail-header" });

    const backButton = titleContainer.createEl("button", {
      text: "← Back",
      cls: "back-button",
    });
    backButton.addEventListener("click", () => {
      this.currentView = "overview";
      this.selectedLog = null;
      this.render();
    });

    titleContainer.createEl("h3", { text: `${log.type.toUpperCase()} Logs` });

    // Sort entries chronologically (earliest first)
    const sortedEntries = [...log.entries].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Create entries container
    const entriesContainer = this.container.createDiv({
      cls: "log-entries-container",
    });

    entriesContainer.createEl("h4", {
      text: `Found ${sortedEntries.length} entries:`,
      cls: "entries-header",
    });

    const entriesList = entriesContainer.createDiv({ cls: "entries-list" });

    for (const entry of sortedEntries) {
      const entryCard = entriesList.createDiv({ cls: "entry-card" });

      // Entry header with date and title
      const entryHeader = entryCard.createDiv({ cls: "entry-header" });

      const dateButton = entryHeader.createEl("button", {
        text: entry.date,
        cls: "entry-date-button",
      });

      dateButton.addEventListener("click", async () => {
        // Open the file
        const fileToOpen = this.plugin.app.vault.getAbstractFileByPath(
          entry.filePath
        );
        if (fileToOpen instanceof TFile) {
          await this.plugin.app.workspace.getLeaf().openFile(fileToOpen);
        }
      });

      if (entry.title) {
        entryHeader.createEl("h5", {
          text: entry.title,
          cls: "entry-title",
        });
      }

      // Entry content
      const entryContent = entryCard.createDiv({ cls: "entry-content" });

      // Show image if available
      if (entry.hasImage && entry.imagePath) {
        const imageContainer = entryContent.createDiv({ cls: "entry-image" });

        let resolvedImagePath = entry.imagePath;

        // Handle different image path formats
        if (
          !resolvedImagePath.includes("/") &&
          !resolvedImagePath.includes("\\")
        ) {
          // If it's just a filename, look in common attachment folders
          const possiblePaths = [
            entry.imagePath,
            `attachments/${entry.imagePath}`,
            `assets/${entry.imagePath}`,
            `images/${entry.imagePath}`,
            `_attachments/${entry.imagePath}`,
          ];

          for (const path of possiblePaths) {
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (file) {
              resolvedImagePath = path;
              break;
            }
          }
        }

        // Try to find the image file
        const imageFile =
          this.plugin.app.vault.getAbstractFileByPath(resolvedImagePath);
        if (imageFile) {
          const img = imageContainer.createEl("img", {
            cls: "log-entry-image",
            attr: { alt: "Log image" },
          });

          // Use Obsidian's resource path resolver
          const resourcePath =
            this.plugin.app.vault.adapter.getResourcePath(resolvedImagePath);
          img.src = resourcePath;

          // Add error handling for broken images
          img.addEventListener("error", () => {
            console.log(`Failed to load image: ${resolvedImagePath}`);
            imageContainer.addClass("habsiad-hidden");
          });

          // Add success handling
          img.addEventListener("load", () => {
            console.log(`Successfully loaded image: ${resolvedImagePath}`);
          });
        } else {
          console.log(`Image file not found: ${resolvedImagePath}`);
        }
      }

      // Show content preview (first 200 characters)
      const contentPreview =
        entry.content.length > 200
          ? entry.content.substring(0, 200) + "..."
          : entry.content;

      entryContent.createEl("p", {
        text: contentPreview,
        cls: "entry-text",
      });
    }

    // Add summary
    const summaryDiv = this.container.createDiv({ cls: "logs-summary" });
    summaryDiv.createEl("p", {
      text: `Total ${log.type.toLowerCase()} entries: ${log.count}.`,
      cls: "summary-text",
    });
  }

  private async scanForLogs(): Promise<LogData[]> {
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.plugin.app.vault.getAbstractFileByPath(journalFolderName);

    console.log(`Looking for journal folder: ${journalFolderName}`);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      throw new Error(`Journal folder "${journalFolderName}" not found.`);
    }

    // Get all journal files recursively with YYYY-MM-DD.md format
    const journalFiles = this.getJournalFilesRecursively(journalFolder);

    console.log(
      `Found ${journalFiles.length} journal files to scan (including subfolders):`,
      journalFiles.map((f: TFile) => f.path)
    );

    const logMap = new Map<string, LogData>();

    // Pattern to match Obsidian callouts: > [!TYPE] #### Title
    const calloutPattern = />\s*\[!([^\]]+)\]\s*(.*?)$/gm;

    for (const file of journalFiles) {
      try {
        const content = await this.plugin.app.vault.read(file);

        // Look for Reflections section (with or without colon)
        const reflectionsMatch = content.match(
          /## Reflections:?([\s\S]*?)(?=\n##|$)/
        );

        if (!reflectionsMatch) {
          console.log(`No Reflections section found in ${file.name}`);
          continue;
        }

        console.log(`Found Reflections in ${file.name}`);
        const reflectionsSection = reflectionsMatch[1];

        // Find all callout blocks in the reflections section
        let match;
        while ((match = calloutPattern.exec(reflectionsSection)) !== null) {
          const logType = match[1].trim().toLowerCase();
          const titleLine = match[2].trim();

          console.log(`Found callout: [!${logType}] in ${file.name}`);

          // Extract the full callout block
          const calloutStart = match.index;
          const fullCalloutMatch = this.extractFullCallout(
            reflectionsSection,
            calloutStart
          );

          if (!fullCalloutMatch) continue;

          const {
            content: fullContent,
            hasImage,
            imagePath,
          } = fullCalloutMatch;

          // Extract title from the title line (remove #### if present)
          const title = titleLine.replace(/^#+\s*/, "");

          // Extract date from filename (YYYY-MM-DD)
          const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
          const date = dateMatch ? dateMatch[1] : file.name;

          if (logMap.has(logType)) {
            const existing = logMap.get(logType)!;
            existing.count++;
            existing.entries.push({
              fileName: file.name,
              date: date,
              filePath: file.path,
              title: title,
              content: fullContent,
              hasImage: hasImage,
              imagePath: imagePath,
            });
          } else {
            logMap.set(logType, {
              type: logType,
              count: 1,
              entries: [
                {
                  fileName: file.name,
                  date: date,
                  filePath: file.path,
                  title: title,
                  content: fullContent,
                  hasImage: hasImage,
                  imagePath: imagePath,
                },
              ],
            });
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error);
      }
    }

    return Array.from(logMap.values());
  }

  private extractFullCallout(
    text: string,
    startIndex: number
  ): { content: string; hasImage: boolean; imagePath?: string } | null {
    const lines = text.substring(startIndex).split("\n");
    const calloutLines: string[] = [];
    let hasImage = false;
    let imagePath: string | undefined;

    for (const line of lines) {
      if (line.startsWith(">")) {
        calloutLines.push(line.substring(1).trim());

        // Check for image references - both Obsidian [[]] and markdown ![]() formats
        const obsidianImageMatch = line.match(/!\[\[([^\]]+)\]\]/);
        const markdownImageMatch = line.match(/!\[.*?\]\(([^)]+)\)/);

        if (obsidianImageMatch) {
          hasImage = true;
          imagePath = obsidianImageMatch[1];
        } else if (markdownImageMatch) {
          hasImage = true;
          imagePath = markdownImageMatch[1];
        }
      } else if (line.trim() === "") {
        // Empty lines are part of the callout if we're inside one
        if (calloutLines.length > 0) {
          calloutLines.push("");
        }
      } else {
        // Non-callout line, end of callout block
        break;
      }
    }

    if (calloutLines.length === 0) return null;

    const content = calloutLines.join("\n").trim();
    return { content, hasImage, imagePath };
  }

  private getJournalFilesRecursively(folder: TFolder): TFile[] {
    const journalFiles: TFile[] = [];

    const processFolder = (currentFolder: TFolder) => {
      for (const child of currentFolder.children) {
        if (child instanceof TFile) {
          // Check if file matches journal format YYYY-MM-DD.md
          if (child.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
            journalFiles.push(child);
          }
        } else if (child instanceof TFolder) {
          // Recursively process subfolders
          processFolder(child);
        }
      }
    };

    processFolder(folder);
    return journalFiles;
  }
}

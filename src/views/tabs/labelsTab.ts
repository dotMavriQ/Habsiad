import { TFile, TFolder } from "obsidian";
import type HabsiadPlugin from "../../main";

interface LabelData {
  emoji: string;
  count: number;
  examples: string[];
  files: Array<{
    fileName: string;
    date: string;
    filePath: string;
    occurrences: string[];
  }>;
}

export class LabelsTab {
  private plugin: HabsiadPlugin;
  private container: HTMLElement;
  private currentView: "overview" | "detail" = "overview";
  private selectedLabel: LabelData | null = null;

  constructor(plugin: HabsiadPlugin, container: HTMLElement) {
    this.plugin = plugin;
    this.container = container;
  }

  async render() {
    this.container.empty();

    if (this.currentView === "overview") {
      await this.renderOverview();
    } else if (this.currentView === "detail" && this.selectedLabel) {
      this.renderDetailView(this.selectedLabel);
    }
  }

  private async renderOverview() {
    // Create header
    const header = this.container.createDiv({ cls: "tab-header" });
    header.createEl("h3", { text: "🏷️ Labels" });

    // Create loading indicator
    const loadingDiv = this.container.createDiv({ cls: "loading-indicator" });
    loadingDiv.createEl("p", { text: "Scanning journal files for labels..." });

    try {
      // Scan for labels
      const labels = await this.scanForLabels();

      // Remove loading indicator
      loadingDiv.remove();

      if (labels.length === 0) {
        const noDataDiv = this.container.createDiv({ cls: "no-data" });
        noDataDiv.createEl("p", { text: "No labels found in journal files." });
        return;
      }

      // Create labels grid
      const labelsGrid = this.container.createDiv({ cls: "labels-grid" });

      // Sort labels by count (descending) and then alphabetically
      labels.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.emoji.localeCompare(b.emoji);
      });

      // Create buttons for each label
      for (const label of labels) {
        const labelButton = labelsGrid.createEl("button", {
          cls: "label-button",
          title: `${label.emoji} - Found ${label.count} time(s)`,
        });

        // Add emoji and count
        const emojiSpan = labelButton.createSpan({ cls: "label-emoji" });
        emojiSpan.textContent = label.emoji;

        const countSpan = labelButton.createSpan({ cls: "label-count" });
        countSpan.textContent = `(${label.count})`;

        // Click handler to show detailed view
        labelButton.addEventListener("click", () => {
          this.selectedLabel = label;
          this.currentView = "detail";
          this.render();
        });
      }

      // Add summary
      const summaryDiv = this.container.createDiv({ cls: "labels-summary" });
      summaryDiv.createEl("p", {
        text: `Found ${labels.length} unique labels across all journal files.`,
        cls: "summary-text",
      });
    } catch (error) {
      loadingDiv.remove();
      console.error("Error scanning for labels:", error);

      const errorDiv = this.container.createDiv({ cls: "error-message" });
      errorDiv.createEl("p", {
        text: "Error scanning journal files. Check console for details.",
      });
    }
  }

  private renderDetailView(label: LabelData) {
    // Create header with back button
    const header = this.container.createDiv({ cls: "tab-header" });
    const titleContainer = header.createDiv({ cls: "detail-header" });

    const backButton = titleContainer.createEl("button", {
      text: "← Back",
      cls: "back-button",
    });
    backButton.addEventListener("click", () => {
      this.currentView = "overview";
      this.selectedLabel = null;
      this.render();
    });

    titleContainer.createEl("h3", { text: `${label.emoji} Label Details` });

    // Sort files chronologically (earliest first)
    const sortedFiles = [...label.files].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Create files list
    const filesContainer = this.container.createDiv({
      cls: "label-files-container",
    });

    filesContainer.createEl("h4", {
      text: `Found in ${sortedFiles.length} journal entries:`,
      cls: "files-header",
    });

    const filesList = filesContainer.createDiv({ cls: "files-list" });

    for (const file of sortedFiles) {
      const fileItem = filesList.createDiv({ cls: "file-item" });

      // Date link (clickable)
      const dateLink = fileItem.createEl("button", {
        text: file.date,
        cls: "date-link-button",
      });

      dateLink.addEventListener("click", async () => {
        // Open the file
        const fileToOpen = this.plugin.app.vault.getAbstractFileByPath(
          file.filePath
        );
        if (fileToOpen instanceof TFile) {
          await this.plugin.app.workspace.getLeaf().openFile(fileToOpen);
        }
      });

      // Show occurrences in this file
      const occurrencesList = fileItem.createDiv({ cls: "occurrences-list" });
      for (const occurrence of file.occurrences) {
        const occurrenceSpan = occurrencesList.createSpan({
          text: occurrence,
          cls: "occurrence-item",
        });
      }
    }

    // Add summary
    const summaryDiv = this.container.createDiv({ cls: "labels-summary" });
    summaryDiv.createEl("p", {
      text: `Total occurrences: ${label.count} across ${sortedFiles.length} journal entries.`,
      cls: "summary-text",
    });
  }

  private async scanForLabels(): Promise<LabelData[]> {
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

    const labelMap = new Map<string, LabelData>();

    // Pattern to match labels: `emoji: value`
    // First, find all potential matches with backticks and colons
    const potentialLabelPattern = /`([^`]+?):\s*([^`]*)`/g;

    for (const file of journalFiles) {
      try {
        const content = await this.plugin.app.vault.read(file);

        // Look for Work Summary section
        const workSummaryMatch = content.match(
          /## Work Summary([\s\S]*?)(?=\n##|$)/
        );

        // Look for Reflections section (with or without colon)
        const reflectionsMatch = content.match(
          /## Reflections:?([\s\S]*?)(?=\n##|$)/
        );

        const sectionsToScan = [];
        if (workSummaryMatch) {
          sectionsToScan.push(workSummaryMatch[1]);
          console.log(`Found Work Summary in ${file.name}`);
        }
        if (reflectionsMatch) {
          sectionsToScan.push(reflectionsMatch[1]);
          console.log(`Found Reflections in ${file.name}`);
        }

        if (sectionsToScan.length === 0) {
          console.log(`No relevant sections found in ${file.name}`);
          // Let's also check what sections DO exist
          const allHeaders = content.match(/^## .+$/gm);
          console.log(`Headers found in ${file.name}:`, allHeaders);
        }

        // Scan each relevant section
        for (const section of sectionsToScan) {
          let match;
          while ((match = potentialLabelPattern.exec(section)) !== null) {
            const emoji = match[1].trim();
            const value = match[2].trim();
            const fullMatch = match[0];

            // Only process if it contains actual emoji characters
            // This regex checks for common emoji patterns
            const isEmoji =
              /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]|[\u{238C}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u.test(
                emoji
              );

            if (!isEmoji) {
              console.log(
                `Skipping non-emoji label: ${fullMatch} in ${file.name}`
              );
              continue;
            }

            console.log(
              `Found valid emoji label: ${fullMatch} in ${file.name}`
            );

            console.log(
              `Found valid emoji label: ${fullMatch} in ${file.name}`
            );

            // Process the validated emoji label
            if (emoji) {
              // Extract date from filename (YYYY-MM-DD)
              const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
              const date = dateMatch ? dateMatch[1] : file.name;

              if (labelMap.has(emoji)) {
                const existing = labelMap.get(emoji)!;
                existing.count++;
                // Store a few examples (limit to 5)
                if (existing.examples.length < 5) {
                  existing.examples.push(fullMatch);
                }

                // Check if we already have this file recorded
                const existingFile = existing.files.find(
                  (f) => f.fileName === file.name
                );
                if (existingFile) {
                  existingFile.occurrences.push(fullMatch);
                } else {
                  existing.files.push({
                    fileName: file.name,
                    date: date,
                    filePath: file.path,
                    occurrences: [fullMatch],
                  });
                }
              } else {
                labelMap.set(emoji, {
                  emoji,
                  count: 1,
                  examples: [fullMatch],
                  files: [
                    {
                      fileName: file.name,
                      date: date,
                      filePath: file.path,
                      occurrences: [fullMatch],
                    },
                  ],
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error);
      }
    }

    return Array.from(labelMap.values());
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

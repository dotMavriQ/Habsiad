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

    // Table header (refactored to include 📗 and 📘 in the array)
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    ["DATE", "⭐", "🔨", "🛠️", "🥗", "📗", "📘" /* G-column header */].forEach(
      (text) => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
      }
    );

    const tbody = table.createTBody();
    const journalFolder = this.getJournalFolder();
    if (journalFolder) {
      const files = this.getJournalFiles(journalFolder);
      for (const file of files) {
        if (!(file instanceof TFile)) continue; // Ensure it's a file

        const row = tbody.insertRow();
        const fileContent = await this.app.vault.read(file);

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
        const hasWorkHeader = fileContent.includes("## WORK:");
        const firstHeaderMatch = fileContent.match(/^# (.+)$/m);
        const firstHeader = firstHeaderMatch
          ? firstHeaderMatch[1].trim().toUpperCase()
          : "";
        const isWeekend =
          firstHeader === "SATURDAY" || firstHeader === "SUNDAY";

        if (isWeekend && hasWorkHeader) {
          workCell.textContent = "❌";
          workCell.title = "Work logged on a weekend";
        } else if (hasWorkHeader) {
          workCell.textContent = "🔨";
          workCell.title = "Workday";
        } else if (h5Text) {
          workCell.textContent = "😃";
          workCell.title = "Vacation or holiday";
        } else {
          workCell.textContent = "😌";
          workCell.title = "Weekend";
        }

        // Work Summary & Completed Tasks (Column D)
        const workSummaryCell = row.insertCell();
        if (!hasWorkHeader) {
          workSummaryCell.textContent = "😌";
          workSummaryCell.title = "No work logged";
        } else {
          const summaryMatch = fileContent.match(
            /###### Summary:\n([\s\S]*?)\n### Goals for Today:/
          );
          const summaryText = summaryMatch ? summaryMatch[1].trim() : "";
          const wordCount = summaryText ? summaryText.split(/\s+/).length : 0;
          let summaryIndicator = "❌";
          let summaryTooltip = "Incomplete Summary";

          if (wordCount > 60) {
            summaryIndicator = "✅";
            summaryTooltip = "Completed Summary";
          } else if (wordCount > 0) {
            summaryIndicator = "❗";
            summaryTooltip = "Insufficient Summary";
          }

          const goalsMatch = fileContent.match(
            /### Goals for Today:\n([\s\S]*?)\n## LIFE:/
          );
          const goalsText = goalsMatch ? goalsMatch[1].trim() : "";
          const completedTasks = (goalsText.match(/- \[x\]/g) || []).length;
          let goalsIndicator = "❌";
          let goalsTooltip = "No goals in place";

          if (completedTasks > 0) {
            goalsIndicator = `<b>${completedTasks}</b>`;
            goalsTooltip = `${completedTasks} completed tasks`;
          }

          workSummaryCell.innerHTML = `${summaryIndicator}, ${goalsIndicator}`;
          workSummaryCell.title = `${summaryTooltip}, ${goalsTooltip}`;
        }

        // Food Tracking (Column E) - Plugin Version (modified)
        const foodCell = row.insertCell();
        let mealCount = 0;
        let totalCalories = 0;

        // Read file content for Obsidian
        const foodLines = fileContent.split("\n");
        // Use a regex to catch any header that ends with "FOOD:" (e.g. ### FOOD: or #### FOOD:)
        const foodIndex = foodLines.findIndex((line) =>
          /^#+\s*FOOD:$/i.test(line.trim())
        );

        if (foodIndex !== -1 && foodIndex + 3 < foodLines.length) {
          let currentLineIndex = foodIndex + 3; // Move to the first meal row

          for (const mealType of ["Breakfast", "Lunch", "Dinner", "Snacks"]) {
            if (currentLineIndex >= foodLines.length) break; // Stop if out of bounds

            const mealRow = foodLines[currentLineIndex];
            if (!mealRow.includes("|")) {
              currentLineIndex++;
              continue;
            }

            // **Step 1: Split and normalize the row**
            let columns = mealRow.split("|").map((col) => col.trim());
            // Remove empty leading/trailing elements if present.
            if (columns[0] === "") {
              columns.shift();
            }
            if (columns[columns.length - 1] === "") {
              columns.pop();
            }
            // Now the expected structure is: [MEAL, MEAL CONTENT, EST.CALORIES]

            // **Step 2: Process the row if it matches the expected meal type**
            if (columns.length >= 3 && columns[0] === mealType) {
              // Count the meal if the MEAL CONTENT cell is non-empty.
              if (columns[1].length > 0) {
                mealCount++;
              }
              // Sum calories if the EST.CALORIES cell contains a valid number.
              if (/^\d+$/.test(columns[2])) {
                totalCalories += parseInt(columns[2], 10);
              }
            }

            currentLineIndex++; // Move to the next row
          }
        }

        // **Step 3: Choose the appropriate emoji based on meal count**
        const mealEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣"];
        const displayEmoji = mealEmojis[Math.min(mealCount, 4)];

        // **Step 4: Create the emoji element with tooltip and insert it**
        const emojiSpan = document.createElement("span");
        emojiSpan.textContent = displayEmoji;
        emojiSpan.style.cursor = "pointer";
        emojiSpan.title = `Total calories: ${totalCalories}`;
        foodCell.appendChild(emojiSpan);

        // F-Column Logic (Column F)
        const fCell = row.insertCell();
        // Extract the TODO section from the file content:
        // It matches "### TODO:" and captures text until the next header (line starting with "###") or end-of-file.
        const todoMatch = fileContent.match(
          /### TODO:\s*([\s\S]*?)(?=\n###|$)/
        );
        const todoSection = todoMatch ? todoMatch[1].trim() : "";
        const todoLines = todoSection
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");
        const templateTasks = ["- [ ] Task 1", "- [ ] Task 2", "- [ ] Task 3"];
        const isTemplate =
          todoLines.length === templateTasks.length &&
          templateTasks.every((task, i) => todoLines[i] === task);
        const isEmpty = todoLines.length === 0;

        if (isEmpty || isTemplate) {
          fCell.textContent = "❌";
          fCell.title =
            "No updates: Only template tasks or empty TODO section.";
        } else {
          const uncheckedTasks = todoLines.filter((line) =>
            line.startsWith("- [ ]")
          );
          // Use the file's basename as the journal date
          const journalDate = file.basename.replace(".md", "");
          const currentDate = new Date().toISOString().split("T")[0];

          if (journalDate !== currentDate && uncheckedTasks.length > 0) {
            fCell.textContent = "❗";
            fCell.title = "Warning: Incomplete tasks from a previous day.";
          } else {
            const checkedTasks = todoLines.filter((line) =>
              /^- \[[xX]\]/.test(line)
            );
            const count = checkedTasks.length;
            fCell.innerHTML = `<b>${count}</b>`;
            fCell.title = `Amount of TODO-tasks cleared: ${count}`;
          }
        }

        // G-Column Logic (Column G: Reflections)
        const gCell = row.insertCell();
        let reflectionsSection = "";
        // Check if an Achievements header exists
        const achievementsHeaderMatch = fileContent.match(/\n## Achievements/);
        if (achievementsHeaderMatch) {
          // If Achievements header exists, extract text between Reflections and Achievements.
          const reflectionsMatch = fileContent.match(
            /### Reflections:\s*([\s\S]*?)(?=\n## Achievements)/
          );
          reflectionsSection = reflectionsMatch
            ? reflectionsMatch[1].trim()
            : "";
        } else {
          // If no Achievements header, use the content from Reflections until EOF.
          const reflectionsStartMatch = fileContent.match(
            /### Reflections:\s*([\s\S]*)/
          );
          reflectionsSection = reflectionsStartMatch
            ? reflectionsStartMatch[1].trim()
            : "";
        }
        const reflectionLines = reflectionsSection
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");
        const bulletLines = reflectionLines.filter((line) =>
          line.startsWith("- ")
        );
        // Use a regex to detect a template bullet (ignoring minor differences)
        const templatePattern = /- Thoughts or notes about personal life/i;
        if (
          bulletLines.length === 0 ||
          (bulletLines.length === 1 && templatePattern.test(bulletLines[0]))
        ) {
          gCell.textContent = "❌";
          gCell.title = "no Reflections found";
        } else {
          gCell.innerHTML = `<b>${bulletLines.length}</b>`;
          gCell.title = `Amount of reflections: ${bulletLines.length}`;
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

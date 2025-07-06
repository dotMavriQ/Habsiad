import { App, TFolder, TFile } from "obsidian";
import HabsiadPlugin from "../../main"; // Import plugin to access settings

export class DataQualityDiagnosticsView {
  private app: App;
  private plugin: HabsiadPlugin;

  constructor(app: App, plugin: HabsiadPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async render(): Promise<HTMLElement> {
    const container = document.createElement("div");
    container.classList.add("data-quality-diagnostics");

    const table = document.createElement("table");
    table.classList.add("habsiad-diagnostics-table");
    table.setAttr("style", "margin: 10px 0;");

    // Table header with 8 columns: DATE, ⭐, 🔨, 🛠️, 🥗, 📗, 📘, 📙
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    [
      "DATE",
      "⭐",
      "🔨",
      "🛠️",
      "🥗",
      "📗", // TODO
      "📘", // Reflections
      "📙", // Achievements & Dailies
    ].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    const journalFolder = this.getJournalFolder();

    if (!journalFolder) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8; // Span across all 8 columns
      cell.textContent =
        "Journal folder not found. Please check your settings.";
    } else {
      const files = this.getJournalFiles(journalFolder);
      if (files.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8; // Span across all 8 columns
        cell.textContent = "No journal files found in the specified folder.";
      } else {
        await this.processJournalFiles(files, tbody);
      }
    }

    container.appendChild(table);
    return container;
  }

  private async processJournalFiles(
    files: TFile[],
    tbody: HTMLTableSectionElement
  ): Promise<void> {
    for (const file of files) {
      if (!(file instanceof TFile)) continue;

      const row = tbody.insertRow();
      const fileContent = await this.app.vault.read(file);

      // Column A: Date
      const dateCell = row.insertCell();
      const dateLink = document.createElement("a");
      dateLink.textContent = file.basename.replace(".md", "");
      dateLink.href = "#";
      dateLink.style.textDecoration = "none";
      dateLink.style.color = "inherit";
      dateLink.style.cursor = "pointer";
      dateLink.classList.add("date-link");
      dateLink.onclick = (e) => {
        e.preventDefault();
        this.app.workspace.openLinkText(file.path, "", true);
      };
      dateCell.appendChild(dateLink);

      // Column B: Star (H5 headers)
      const h5Cell = row.insertCell();
      const h5Text = await this.extractH5Text(file);
      if (h5Text) {
        const starLink = document.createElement("a");
        starLink.textContent = "⭐";
        starLink.href = "#";
        starLink.title = h5Text;
        starLink.style.textDecoration = "none";
        starLink.style.cursor = "pointer";
        starLink.classList.add("star-link");
        starLink.onclick = (e) => {
          e.preventDefault();
          this.app.workspace.openLinkText(file.path, "", true);
        };
        h5Cell.appendChild(starLink);
      }

      // Column C: Work Status
      const workCell = row.insertCell();
      const hasWorkHeader = fileContent.includes("## WORK:");
      const firstHeaderMatch = fileContent.match(/^# (.+)$/m);
      const firstHeader = firstHeaderMatch
        ? firstHeaderMatch[1].trim().toUpperCase()
        : "";
      const isWeekend = firstHeader === "SATURDAY" || firstHeader === "SUNDAY";

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

      // Column D: Work Summary & Completed Tasks
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

      // Column E: Food Tracking
      const foodCell = row.insertCell();
      let mealCount = 0;
      let totalCalories = 0;
      const foodLines = fileContent.split("\n");
      const foodIndex = foodLines.findIndex((line) =>
        /^#+\s*FOOD:$/i.test(line.trim())
      );

      if (foodIndex !== -1 && foodIndex + 3 < foodLines.length) {
        let currentLineIndex = foodIndex + 3;
        for (const mealType of ["Breakfast", "Lunch", "Dinner", "Snacks"]) {
          if (currentLineIndex >= foodLines.length) break;
          const mealRow = foodLines[currentLineIndex];
          if (!mealRow.includes("|")) {
            currentLineIndex++;
            continue;
          }
          let columns = mealRow.split("|").map((col) => col.trim());
          if (columns[0] === "") {
            columns.shift();
          }
          if (columns[columns.length - 1] === "") {
            columns.pop();
          }
          if (columns.length >= 3 && columns[0] === mealType) {
            if (columns[1].length > 0) {
              mealCount++;
            }
            if (/^\d+$/.test(columns[2])) {
              totalCalories += parseInt(columns[2], 10);
            }
          }
          currentLineIndex++;
        }
      }
      const mealEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣"];
      const displayEmoji = mealEmojis[Math.min(mealCount, 4)];
      const emojiSpan = document.createElement("span");
      emojiSpan.textContent = displayEmoji;
      emojiSpan.style.cursor = "pointer";
      emojiSpan.classList.add("emoji-indicator");
      emojiSpan.title = `Total calories: ${totalCalories}`;
      foodCell.appendChild(emojiSpan);

      // Column F: TODO Section
      const fCell = row.insertCell();
      const todoMatch = fileContent.match(/### TODO:\s*([\s\S]*?)(?=\n###|$)/);
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
        fCell.title = "No updates: Only template tasks or empty TODO section.";
      } else {
        const uncheckedTasks = todoLines.filter((line) =>
          line.startsWith("- [ ]")
        );
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

      // Column G: Reflections
      const gCell = row.insertCell();
      let reflectionsSection = "";
      const achievementsHeaderMatch = fileContent.match(/\n## Achievements/);
      if (achievementsHeaderMatch) {
        const reflectionsMatch = fileContent.match(
          /### Reflections:\s*([\s\S]*?)(?=\n## Achievements)/
        );
        reflectionsSection = reflectionsMatch ? reflectionsMatch[1].trim() : "";
      } else {
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
      // Use regex to match a template bullet (allowing minor variations)
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

      // Column H: Achievements & Dailies
      const hColCell = row.insertCell();
      // Regexes to extract Achievements and Completed Dailies sections.
      const achievementsRegex =
        /## Achievements on\s+([0-9]{4}-[0-9]{2}-[0-9]{2})([\s\S]*?)(?=\n## Completed Dailies)/;
      const dailiesRegex = /## Completed Dailies\s*([\s\S]*)/;
      const achievementsMatch = fileContent.match(achievementsRegex);
      const dailiesMatch = fileContent.match(dailiesRegex);
      if (!achievementsMatch || !dailiesMatch) {
        hColCell.textContent = "❌";
        hColCell.title = "Achievements & Dailies not found";
      } else {
        const achievementsDate = achievementsMatch[1].trim();
        const fileDate = file.basename.replace(".md", "");
        if (achievementsDate !== fileDate) {
          hColCell.textContent = "❗";
          hColCell.title = "incorrect date set";
        } else {
          // Count habit lines in the Achievements section.
          const achievementsText = achievementsMatch[2];
          const habitLines =
            achievementsText.match(/^\* Habit clicked:/gm) || [];
          // Count daily lines in Completed Dailies (lines starting with "* " but not habit lines).
          const dailiesText = dailiesMatch[1];
          const dailyLines =
            dailiesText.match(/^\* (?!Habit clicked:)/gm) || [];
          hColCell.innerHTML = `<b>${habitLines.length}, ${dailyLines.length}</b>`;
          hColCell.title = `Habits: ${habitLines.length}, Dailies: ${dailyLines.length}`;
        }
      }
    }
  }

  private getJournalFolder(): TFolder | null {
    const folderName = this.plugin.settings.journalFolderName || "Journal";
    const folder = this.app.vault.getAbstractFileByPath(folderName);
    return folder instanceof TFolder ? folder : null;
  }

  private getJournalFiles(folder: TFolder): TFile[] {
    return folder.children
      .filter((f) => f instanceof TFile && f.extension === "md")
      .map((f) => f as TFile)
      .sort((a, b) => a.basename.localeCompare(b.basename));
  }

  private async extractH5Text(file: TFile): Promise<string | null> {
    const content = await this.app.vault.read(file);
    const match = content.match(/# .+?\n([\s\S]*?)\n## LIFE:/);
    if (!match) return null;
    const h5Lines = match[1]
      .split("\n")
      .filter((line) => line.startsWith("##### ") && !line.startsWith("######"))
      .map((line) => line.replace("##### ", "").trim());
    return h5Lines.length > 0 ? h5Lines.join(" ") : null;
  }
}

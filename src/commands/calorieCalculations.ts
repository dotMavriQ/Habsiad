import { Notice, TFile, TFolder } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";

/**
 * Calorie Calculations Handler
 * Handles parsing and calculating calorie totals from journal files
 */
export class CalorieCalculations {
  private plugin: IHabsiadPlugin;

  constructor(plugin: IHabsiadPlugin) {
    this.plugin = plugin;
  }

  /**
   * Calculates calorie totals by properly parsing the EST.CALORIES column in markdown tables
   * and updating the calories frontmatter key with the sum.
   */
  async calculateCalorieTotals() {
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.plugin.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      new Notice(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    // Get all journal files with YYYY-MM-DD.md format
    const journalFiles = journalFolder.children
      .filter(
        (file) =>
          file instanceof TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)
      )
      .sort((a, b) => b.name.localeCompare(a.name)) as TFile[]; // Sort by date descending

    let filesProcessed = 0;
    let filesUpdated = 0;

    // Debug printing function removed for production compliance

    for (const file of journalFiles) {
      filesProcessed++;
      const content = await this.plugin.app.vault.read(file);

      // Very specific approach: Look for a markdown table that has EST.CALORIES in the header
      // The crucial part is to properly parse the table structure with vertical bars
      // Start by looking at the content line by line, but preserve the exact format of each line
      const lines = content.split("\n");
      let foundCalorieTable = false;
      let calorieTableLines: string[] = [];
      let tableStartLine = 0;

      // First find a table with EST.CALORIES in the header
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for a header row that contains EST.CALORIES
        if (
          line.includes("EST.CALORIES") &&
          line.startsWith("|") &&
          line.endsWith("|")
        ) {
          foundCalorieTable = true;
          tableStartLine = i;
          break;
        }
      }

      if (!foundCalorieTable) {
        // No calorie table found in this file
        continue;
      }

      // Now extract the complete table
      let tableEndLine = tableStartLine;
      for (let i = tableStartLine; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith("|") && line.endsWith("|")) {
          calorieTableLines.push(line);
          tableEndLine = i;
        } else if (i > tableStartLine) {
          // We've reached the end of the table
          break;
        }
      }

      // Make sure we have a header and at least one data row
      if (calorieTableLines.length < 3) {
        console.log(
          `Table too short in ${file.name}, found ${calorieTableLines.length} lines`
        );
        continue;
      }

      const tableText = calorieTableLines.join("\n");
      // Debug table printing removed for production compliance

      // Parse the header to find the column index for EST.CALORIES
      const headerLine = calorieTableLines[0];
      const headerCells = headerLine.split("|").map((cell) => cell.trim());

      // Find the index of the EST.CALORIES column (accounting for the empty cells at start/end)
      let estCaloriesColumnIndex = -1;
      for (let i = 0; i < headerCells.length; i++) {
        if (headerCells[i].toUpperCase() === "EST.CALORIES") {
          estCaloriesColumnIndex = i;
          break;
        }
      }

      if (estCaloriesColumnIndex === -1) {
        console.log(
          `Could not find EST.CALORIES column in header: ${headerLine}`
        );
        continue;
      }

      console.log(
        `EST.CALORIES column is at index ${estCaloriesColumnIndex} in ${file.name}`
      );

      // Now process each data row (skipping header and separator)
      let totalCalories = 0;

      for (let i = 2; i < calorieTableLines.length; i++) {
        const dataLine = calorieTableLines[i];
        const dataCells = dataLine.split("|");

        // Ensure the array has enough elements to access the EST.CALORIES column
        if (dataCells.length <= estCaloriesColumnIndex) {
          console.log(`Row has insufficient columns: ${dataLine}`);
          continue;
        }

        // Get the actual cell content at the EST.CALORIES position
        const calorieCell = dataCells[estCaloriesColumnIndex].trim();

        // Debug logging removed for production compliance

        // Skip empty cells or cells with just whitespace
        if (!calorieCell || calorieCell === "") {
          continue;
        }

        // Try to extract a number from the cell
        // This regex looks for one or more digits, ignoring any surrounding text
        const numberMatch = calorieCell.match(/\d+/);

        if (numberMatch) {
          const calories = parseInt(numberMatch[0], 10);
          if (!isNaN(calories) && calories > 0) {
            // Debug logging removed for production compliance
            totalCalories += calories;
          }
        }
      }

      if (totalCalories > 0) {
        // Debug logging removed for production compliance
        // Update the frontmatter with the calculated total
        await this.plugin.frontmatterCommands.updateCaloriesFrontmatter(
          file,
          totalCalories.toString()
        );
        filesUpdated++;
      } else {
        console.log(`No valid calories found in ${file.name}`);
      }
    }

    if (filesUpdated > 0) {
      new Notice(
        `Updated calorie totals in ${filesUpdated} of ${filesProcessed} journal files.`
      );
    } else {
      new Notice(
        `No valid calorie data found. Checked ${filesProcessed} journal files.`
      );
    }
  }
}

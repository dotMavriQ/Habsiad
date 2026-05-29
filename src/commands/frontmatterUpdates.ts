import { TFile } from "obsidian";
import type { IHabsiadPlugin } from "../habitica/types/obsidian";

/**
 * Frontmatter Update Commands
 * Handles updating various frontmatter fields in journal entries
 */
export class FrontmatterCommands {
  private plugin: IHabsiadPlugin;

  constructor(plugin: IHabsiadPlugin) {
    this.plugin = plugin;
  }

  /**
   * Generic frontmatter field update utility
   * @param file - The file to update
   * @param fieldName - The frontmatter field name (e.g., 'steps', 'weight', 'calories')
   * @param newValue - The new value to set
   */
  private async updateFrontmatterField(
    file: TFile,
    fieldName: string,
    newValue: string
  ) {
    let content = await this.plugin.app.vault.read(file);

    // Locate frontmatter section
    const frontmatterRegex = /^---\\n([\\s\\S]*?)\\n---/;
    const match = content.match(frontmatterRegex);
    let newContent;

    if (match) {
      const frontmatterText = match[1];

      // Check if the field already exists
      const fieldRegex = new RegExp(`^${fieldName}:`, "m");
      const hasField = fieldRegex.test(frontmatterText);

      if (hasField) {
        // Modify the existing field value
        const updatedFrontmatter = frontmatterText
          .split("\\n")
          .map((line) =>
            line.startsWith(`${fieldName}:`)
              ? `${fieldName}: ${newValue}`
              : line
          )
          .join("\\n");

        newContent = content.replace(
          frontmatterRegex,
          `---\\n${updatedFrontmatter}\\n---`
        );
      } else {
        // Add the field to the existing frontmatter
        const updatedFrontmatter =
          frontmatterText + `\\n${fieldName}: ${newValue}`;
        newContent = content.replace(
          frontmatterRegex,
          `---\\n${updatedFrontmatter}\\n---`
        );
      }
    } else {
      // If no frontmatter exists, create it
      newContent = `---\\n${fieldName}: ${newValue}\\n---\\n\\n${content}`;
    }

    // Save the updated file
    await this.plugin.app.vault.modify(file, newContent);
  }

  /**
   * Updates the "steps" field in frontmatter
   */
  async updateStepsFrontmatter(file: TFile, newSteps: string) {
    await this.updateFrontmatterField(file, "steps", newSteps);
  }

  /**
   * Updates the "weight" field in frontmatter
   */
  async updateWeightFrontmatter(file: TFile, newWeight: string) {
    await this.updateFrontmatterField(file, "weight", newWeight);
  }

  /**
   * Updates the "calories" field in frontmatter
   */
  async updateCaloriesFrontmatter(file: TFile, newCalories: string) {
    await this.updateFrontmatterField(file, "calories", newCalories);
  }

  /**
   * Save custom frontmatter name-value pair
   */
  async saveCustomFrontmatterName(key: string, value: string) {
    if (!this.plugin.settings.customFrontmatter) {
      this.plugin.settings.customFrontmatter = {};
    }
    this.plugin.settings.customFrontmatter[key] = value;
    await this.plugin.settingsSync.saveSettings(this.plugin.settings);
  }
}

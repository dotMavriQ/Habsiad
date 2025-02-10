import { App, PluginSettingTab, Setting } from "obsidian";
import ObsiticaPlugin from "./main";

export interface ObsiticaSettings {
  habiticaUserId: string;
  habiticaApiToken: string;
  journalFolderName: string; // Added this line
  customFrontmatter: { [key: string]: string };
}

export const DEFAULT_SETTINGS: ObsiticaSettings = {
  habiticaUserId: "",
  habiticaApiToken: "",
  journalFolderName: "Journal", // Added this line
  customFrontmatter: {},
};

export class ObsiticaSettingTab extends PluginSettingTab {
  plugin: ObsiticaPlugin;

  constructor(app: App, plugin: ObsiticaPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsitica Settings" });

    // Habitica User ID Setting
    new Setting(containerEl)
      .setName("Habitica User ID")
      .setDesc("Enter your Habitica User ID.")
      .addText((text) =>
        text
          .setPlaceholder("User ID")
          .setValue(this.plugin.settings.habiticaUserId)
          .onChange(async (value) => {
            this.plugin.settings.habiticaUserId = value;
            await this.plugin.saveSettings();
          })
      );

    // Habitica API Token Setting
    new Setting(containerEl)
      .setName("Habitica API Token")
      .setDesc("Enter your Habitica API Token.")
      .addText((text) =>
        text
          .setPlaceholder("API Token")
          .setValue(this.plugin.settings.habiticaApiToken)
          .onChange(async (value) => {
            this.plugin.settings.habiticaApiToken = value;
            await this.plugin.saveSettings();
          })
      );

    // Journal Folder Name Setting
    new Setting(containerEl)
      .setName("Journal Folder Name")
      .setDesc("Specify the folder where the plugin commands can be used.")
      .addText((text) =>
        text
          .setPlaceholder("Journal")
          .setValue(this.plugin.settings.journalFolderName)
          .onChange(async (value) => {
            this.plugin.settings.journalFolderName = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

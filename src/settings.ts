import { App, PluginSettingTab, Setting, Modifier } from "obsidian";
import ObsiticaPlugin from "./main";

export interface KeyboardShortcut {
  modifiers: Modifier[];
  key: string;
}

export interface ObsiticaSettings {
  habiticaUserId: string;
  habiticaApiToken: string;
  journalFolderName: string;
  customFrontmatter: { [key: string]: string };
  shortcuts: {
    generateHabitsAndDailies: KeyboardShortcut;
    replaceWeekday: KeyboardShortcut;
    syncTodo: KeyboardShortcut;
    syncHabiticaToFrontmatter: KeyboardShortcut;
    calculateCalorieTotals: KeyboardShortcut;
  };
  // Tab visibility options
  showTabs: {
    steps: boolean;
    weight: boolean;
    calories: boolean;
  };
}

export const DEFAULT_SETTINGS: ObsiticaSettings = {
  habiticaUserId: "",
  habiticaApiToken: "",
  journalFolderName: "Journal",
  customFrontmatter: {},
  shortcuts: {
    generateHabitsAndDailies: { modifiers: ["Mod", "Shift"], key: "H" },
    replaceWeekday: { modifiers: ["Mod", "Shift"], key: "D" },
    syncTodo: { modifiers: ["Mod", "Shift"], key: "Y" },
    syncHabiticaToFrontmatter: { modifiers: ["Mod", "Shift"], key: "Q" },
    calculateCalorieTotals: { modifiers: ["Mod", "Shift"], key: "C" },
  },
  // All tabs visible by default
  showTabs: {
    steps: true,
    weight: true,
    calories: true,
  },
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
      
    // Add a section for keyboard shortcuts
    containerEl.createEl("h3", { text: "Keyboard Shortcuts" });
    
    // Helper function to create a shortcut setting
    const createShortcutSetting = (
      id: keyof ObsiticaSettings["shortcuts"],
      name: string,
      desc: string
    ) => {
      const setting = new Setting(containerEl)
        .setName(name)
        .setDesc(desc);
      
      // Add dropdown for modifier keys
      setting.addDropdown((dropdown) => {
        const options = {
          "none": "None",
          "Mod": "Ctrl/Cmd",
          "Mod+Shift": "Ctrl/Cmd+Shift",
          "Mod+Alt": "Ctrl/Cmd+Alt",
          "Alt": "Alt",
          "Alt+Shift": "Alt+Shift"
        };
        
        const currentModifiers = this.plugin.settings.shortcuts[id].modifiers;
        let currentValue = "none";
        if (currentModifiers.includes("Mod") && currentModifiers.includes("Shift")) {
          currentValue = "Mod+Shift";
        } else if (currentModifiers.includes("Mod") && currentModifiers.includes("Alt")) {
          currentValue = "Mod+Alt";
        } else if (currentModifiers.includes("Alt") && currentModifiers.includes("Shift")) {
          currentValue = "Alt+Shift";
        } else if (currentModifiers.includes("Mod")) {
          currentValue = "Mod";
        } else if (currentModifiers.includes("Alt")) {
          currentValue = "Alt";
        }
        
        dropdown
          .addOptions(options)
          .setValue(currentValue)
          .onChange(async (value) => {
            let modifiers: Modifier[] = [];
            if (value === "Mod+Shift") {
              modifiers = ["Mod", "Shift"];
            } else if (value === "Mod+Alt") {
              modifiers = ["Mod", "Alt"];
            } else if (value === "Alt+Shift") {
              modifiers = ["Alt", "Shift"];
            } else if (value !== "none" && (value === "Mod" || value === "Alt")) {
              modifiers = [value];
            }
            
            this.plugin.settings.shortcuts[id].modifiers = modifiers;
            await this.plugin.saveSettings();
          });
      });
      
      // Add text field for key
      setting.addText((text) => {
        text
          .setPlaceholder("Key")
          .setValue(this.plugin.settings.shortcuts[id].key)
          .onChange(async (value) => {
            if (value) {
              this.plugin.settings.shortcuts[id].key = value.toUpperCase();
              await this.plugin.saveSettings();
            }
          });
      });
      
      return setting;
    };
    
    // Create settings for each shortcut
    createShortcutSetting(
      "generateHabitsAndDailies",
      "Generate Habits & Dailies",
      "Shortcut to insert Habitica habits and dailies into the current note."
    );
    
    createShortcutSetting(
      "replaceWeekday",
      "Replace {WEEKDAY}",
      "Shortcut to replace {WEEKDAY} with the actual day of the week."
    );
    
    createShortcutSetting(
      "syncTodo",
      "Sync Habitica TODO",
      "Shortcut to sync Habitica TODOs to the current note."
    );
    
    createShortcutSetting(
      "syncHabiticaToFrontmatter",
      "Sync Habitica to Frontmatter",
      "Shortcut to sync Habitica data to frontmatter in journal files."
    );
    
    createShortcutSetting(
      "calculateCalorieTotals",
      "Calculate Calorie Totals",
      "Shortcut to calculate and update calorie totals in journal files."
    );
    
    // Optional Tabs Section
    containerEl.createEl("h3", { text: "Optional Tabs" });
    containerEl.createEl("p", { 
      text: "Choose which tabs to show in the sidebar. Changes will take effect after reloading the plugin.",
      cls: "setting-item-description" 
    });
    
    // Steps Tab Toggle
    new Setting(containerEl)
      .setName("Show Steps Tab")
      .setDesc("Enable or disable the Steps tab in the sidebar.")
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.showTabs.steps)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.steps = value;
            await this.plugin.saveSettings();
          })
      );
      
    // Weight Tab Toggle
    new Setting(containerEl)
      .setName("Show Weight Tab")
      .setDesc("Enable or disable the Weight tab in the sidebar.")
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.showTabs.weight)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.weight = value;
            await this.plugin.saveSettings();
          })
      );
      
    // Calories Tab Toggle
    new Setting(containerEl)
      .setName("Show Calories Tab")
      .setDesc("Enable or disable the Calories tab in the sidebar.")
      .addToggle(toggle => 
        toggle
          .setValue(this.plugin.settings.showTabs.calories)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.calories = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

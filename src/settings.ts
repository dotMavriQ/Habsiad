import { App, Modal, Notice, PluginSettingTab, Setting } from "obsidian";
import HabsiadPlugin from "./main";
import {
  applyGlossaryJson,
  getGlossaryJson,
} from "./views/tabs/frontmatterGlossary";

export interface HabsiadSettings {
  habiticaUserId: string;
  habiticaApiToken: string;
  journalFolderName: string;
  customFrontmatter: { [key: string]: string };
  // Tab visibility options
  showTabs: {
    steps: boolean;
    weight: boolean;
    calories: boolean;
    alcohol: boolean;
    mood: boolean;
  };
}

export const DEFAULT_SETTINGS: HabsiadSettings = {
  habiticaUserId: "",
  habiticaApiToken: "",
  journalFolderName: "Journal",
  customFrontmatter: {},
  // All tabs visible by default
  showTabs: {
    steps: true,
    weight: true,
    calories: true,
    alcohol: true,
    mood: true,
  },
};

export class HabsiadSettingTab extends PluginSettingTab {
  plugin: HabsiadPlugin;

  constructor(app: App, plugin: HabsiadPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Habsiad Settings" });

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

    // Keyboard shortcuts note. Every Habsiad command is registered with
    // Obsidian, so hotkeys are assigned through Obsidian's own Hotkeys pane
    // (Settings → Hotkeys, search "Habsiad"). All commands are also available
    // in the Command Palette, including on mobile.
    containerEl.createEl("h3", { text: "Keyboard Shortcuts" });
    containerEl.createEl("p", {
      text: 'Assign hotkeys for Habsiad commands in Obsidian\'s Settings → Hotkeys (search "Habsiad"). Every command is also available from the Command Palette, which works on mobile too.',
      cls: "setting-item-description",
    });

    // Optional Tabs Section
    containerEl.createEl("h3", { text: "Optional Tabs" });
    containerEl.createEl("p", {
      text: "Choose which tabs to show in the sidebar. Changes will take effect after reloading the plugin.",
      cls: "setting-item-description",
    });

    // Steps Tab Toggle
    new Setting(containerEl)
      .setName("Show Steps Tab")
      .setDesc("Enable or disable the Steps tab in the sidebar.")
      .addToggle((toggle) =>
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
      .addToggle((toggle) =>
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
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTabs.calories)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.calories = value;
            await this.plugin.saveSettings();
          })
      );

    // Alcohol Tab Toggle
    new Setting(containerEl)
      .setName("Show Alcohol Tab")
      .setDesc("Enable or disable the Alcohol tab in the sidebar.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTabs.alcohol)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.alcohol = value;
            await this.plugin.saveSettings();
          })
      );

    // Mood Index Tab Toggle
    new Setting(containerEl)
      .setName("Show Mood Index Tab")
      .setDesc(
        "Enable or disable the Mood Index tab (emoji mood graph) in the sidebar."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTabs.mood)
          .onChange(async (value) => {
            this.plugin.settings.showTabs.mood = value;
            await this.plugin.saveSettings();
          })
      );

    // Glossary Transfer Section
    containerEl.createEl("h3", { text: "Frontmatter Glossary Transfer" });
    containerEl.createEl("p", {
      text: "Copy or paste the Habsiad frontmatter glossary as JSON to share across devices.",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Copy Glossary JSON")
      .setDesc(
        "Copies the current frontmatterGlossary.json to your clipboard in JSON format."
      )
      .addButton((button) =>
        button
          .setButtonText("Copy JSON")
          .setCta()
          .onClick(async () => {
            await this.handleCopyGlossary();
          })
      );

    new Setting(containerEl)
      .setName("Paste Glossary JSON")
      .setDesc(
        "Replaces the current glossary with JSON from your clipboard or manual paste."
      )
      .addButton((button) =>
        button
          .setButtonText("Paste JSON")
          .setWarning()
          .onClick(async () => {
            await this.handlePasteGlossary();
          })
      );
  }

  private async handleCopyGlossary(): Promise<void> {
    try {
      const json = await getGlossaryJson(this.plugin);
      const copied = await copyTextToClipboard(json);
      if (copied) {
        new Notice("Glossary JSON copied to clipboard.");
      } else {
        new GlossaryCopyModal(this.app, json).open();
      }
    } catch (error) {
      console.error("Failed to copy glossary JSON:", error);
      new Notice("Failed to copy glossary JSON. See console for details.");
    }
  }

  private async handlePasteGlossary(): Promise<void> {
    try {
      const clipboardValue = await readTextFromClipboard();
      if (clipboardValue) {
        await applyGlossaryJson(this.plugin, clipboardValue);
        new Notice("Glossary imported from clipboard.");
        return;
      }
    } catch (error) {
      console.warn(
        "Clipboard import failed, falling back to manual paste.",
        error
      );
    }
    new GlossaryPasteModal(this.app, async (json) => {
      await applyGlossaryJson(this.plugin, json);
      new Notice("Glossary imported successfully.");
    }).open();
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Navigator clipboard write failed:", error);
    }
  }
  const clipboard = getElectronClipboard();
  if (clipboard) {
    clipboard.writeText(text);
    return true;
  }
  return false;
}

async function readTextFromClipboard(): Promise<string | null> {
  if (navigator?.clipboard?.readText) {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        return text;
      }
    } catch (error) {
      console.warn("Navigator clipboard read failed:", error);
    }
  }
  const clipboard = getElectronClipboard();
  if (clipboard) {
    const text = clipboard.readText();
    return text || null;
  }
  return null;
}

function getElectronClipboard(): any {
  const electronRequire = (window as any).require;
  if (typeof electronRequire !== "function") {
    return null;
  }
  try {
    const remote = electronRequire("@electron/remote");
    if (remote?.clipboard) {
      return remote.clipboard;
    }
  } catch (error) {
    console.warn("Failed to load @electron/remote clipboard:", error);
  }
  try {
    const electron = electronRequire("electron");
    if (electron?.clipboard) {
      return electron.clipboard;
    }
    if (electron?.remote?.clipboard) {
      return electron.remote.clipboard;
    }
  } catch (error) {
    console.warn("Failed to load electron clipboard:", error);
  }
  return null;
}

class GlossaryCopyModal extends Modal {
  private json: string;

  constructor(app: App, json: string) {
    super(app);
    this.json = json;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Copy Glossary JSON" });
    contentEl.createEl("p", {
      text: "Clipboard access is restricted. Copy the JSON below manually.",
      cls: "setting-item-description",
    });
    const textArea = contentEl.createEl("textarea", {
      cls: "habsiad-glossary-json-area",
      text: this.json,
    });
    textArea.rows = 18;
    textArea.select();
    const buttonBar = contentEl.createDiv({ cls: "habsiad-modal-actions" });
    const copyButton = buttonBar.createEl("button", {
      text: "Copy to Clipboard",
      cls: "mod-cta",
    });
    copyButton.addEventListener("click", async () => {
      const copied = await copyTextToClipboard(this.json);
      if (copied) {
        new Notice("Glossary JSON copied to clipboard.");
      } else {
        new Notice("Failed to copy to clipboard. Please copy manually.");
      }
    });
    const closeButton = buttonBar.createEl("button", { text: "Close" });
    closeButton.addEventListener("click", () => this.close());
  }
}

class GlossaryPasteModal extends Modal {
  private onSubmit: (json: string) => Promise<void>;

  constructor(app: App, onSubmit: (json: string) => Promise<void>) {
    super(app);
    this.onSubmit = onSubmit;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Paste Glossary JSON" });
    contentEl.createEl("p", {
      text: "Paste your glossary JSON below and click Import to replace the current glossary.",
      cls: "setting-item-description",
    });
    const textArea = contentEl.createEl("textarea", {
      cls: "habsiad-glossary-json-area",
    });
    textArea.rows = 18;
    // Attempt to pre-fill from clipboard when available
    const clipboardValue = await readTextFromClipboard();
    if (clipboardValue) {
      textArea.value = clipboardValue;
    }
    const buttonBar = contentEl.createDiv({ cls: "habsiad-modal-actions" });
    const importButton = buttonBar.createEl("button", {
      text: "Import",
      cls: "mod-warning",
    });
    importButton.addEventListener("click", async () => {
      const value = textArea.value.trim();
      if (!value) {
        new Notice("Please paste glossary JSON before importing.");
        return;
      }
      try {
        await this.onSubmit(value);
        this.close();
      } catch (error) {
        console.error("Failed to import glossary JSON:", error);
        new Notice("Invalid glossary JSON. See console for details.");
      }
    });
    const cancelButton = buttonBar.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => this.close());
  }
}

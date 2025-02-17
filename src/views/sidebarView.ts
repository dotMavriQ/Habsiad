import { ItemView, TFolder, TFile, WorkspaceLeaf } from "obsidian";
import ObsiticaPlugin from "../main"; // Ensure the path matches your project structure

import { displayGlossaryTable } from "./tabs/frontmatterGlossary";
import { DataQualityDiagnosticsView } from "./tabs/dataQualityDiagnostics";

export const VIEW_TYPE_SIDEBAR = "obsitica-sidebar-view";

export class SidebarView extends ItemView {
  private plugin: ObsiticaPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: ObsiticaPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_SIDEBAR;
  }

  getDisplayText() {
    return "Obsitica";
  }

  getIcon() {
    return "diamond"; // Use a suitable icon
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const tabContainer = container.createDiv("obsitica-tab-container");
    const tabs = [
      { emoji: "🏡", view: "info" },
      { emoji: "🔎", view: "diagnostics" },
      { emoji: "⬆️", view: "glossary" },
      { emoji: "👟", view: "steps" },
    ];

    tabs.forEach((tab) => {
      const tabButton = tabContainer.createSpan("obsitica-tab");
      tabButton.setText(tab.emoji);
      tabButton.onClickEvent(() => {
        this.switchTab(tab.view);
        const allTabs = tabContainer.querySelectorAll(".obsitica-tab");
        allTabs.forEach((el) => el.removeClass("active"));
        tabButton.addClass("active");
      });
    });

    const firstTab = tabContainer.querySelector(".obsitica-tab");
    if (firstTab) firstTab.addClass("active");

    const contentArea = container.createDiv("obsitica-content-area");
    this.displayContent(contentArea, "info");
  }

  async onClose() {
    // Cleanup if necessary
  }

  private switchTab(view: string) {
    const contentArea = this.containerEl.querySelector(
      ".obsitica-content-area"
    ) as HTMLElement;
    contentArea.empty();
    this.displayContent(contentArea, view);
  }

  private displayContent(container: HTMLElement, view: string) {
    switch (view) {
      case "info":
        this.displayInfoTab(container);
        break;
      case "diagnostics":
        this.displayDiagnosticsTab(container);
        break;
      case "glossary":
        this.displayGlossaryTab(container);
        break;
      case "steps":
        this.displayStepsTab(container);
        break;
      default:
        container.setText("Default View");
    }
  }

  private async displayDiagnosticsTab(container: HTMLElement) {
    const diagnosticsView = new DataQualityDiagnosticsView(
      this.app,
      this.plugin
    );
    const diagnosticsElement = await diagnosticsView.render();
    container.appendChild(diagnosticsElement);
  }

  private displayGlossaryTab(container: HTMLElement) {
    displayGlossaryTable(container, this.plugin);
  }

  private displayStepsTab(container: HTMLElement) {
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.plugin.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      container.setText(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    container.createEl("h3", { text: "Daily Steps" });

    const files = journalFolder.children.filter(
      (f) => f instanceof TFile && f.extension === "md"
    );

    const dateFileMap = files
      .map((file) => {
        const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/); // Match YYYY-MM-DD.md
        if (!match) return null;
        const [_, year, month, day] = match;
        return { dateString: `${year}-${month}-${day}`, file };
      })
      .filter(Boolean) as { dateString: string; file: TFile }[];

    dateFileMap.sort((a, b) => {
      if (a.dateString < b.dateString) return -1;
      if (a.dateString > b.dateString) return 1;
      return 0;
    });

    const table = container.createEl("table", { cls: "obsitica-steps-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Date (YYYY/MM/DD)" });
    headerRow.createEl("th", { text: "Steps" });

    const tbody = table.createEl("tbody");

    for (const { dateString, file } of dateFileMap) {
      const metadata = this.plugin.app.metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter;
      const currentSteps = frontmatter?.steps ?? "";

      const row = tbody.createEl("tr");
      row.createEl("td", { text: dateString.replace(/-/g, "/") });

      const stepsCell = row.createEl("td");
      const input = stepsCell.createEl("input", { type: "number" });
      if (currentSteps) {
        input.value = currentSteps.toString();
      }

      input.addEventListener("change", async () => {
        const newSteps = input.value.trim();
        console.log("Updating steps for file:", file.name, "to:", newSteps);
        await this.plugin.updateStepsFrontmatter(file, newSteps);
      });
    }
  }

  private displayInfoTab(container: HTMLElement) {
    const infoSection = container.createDiv("obsitica-info-section");
    infoSection.createEl("h3", { text: "Obsitica Plugin" });

    const pluginVersion = this.plugin.manifest.version;
    infoSection.createEl("p", { text: `Version: ${pluginVersion}` });

    infoSection.createEl("h4", { text: "Available Shortcuts" });

    const shortcutsList = infoSection.createEl("ul");

    shortcutsList.createEl("li", {
      text: "Generate Habits & Dailies: Ctrl+Shift+H",
    });

    shortcutsList.createEl("li", {
      text: "Replace {WEEKDAY} with Actual Day: Ctrl+Shift+D",
    });

    infoSection.createEl("hr");
    infoSection.createEl("p", { text: "Thank you for using Obsitica!" });
  }
}

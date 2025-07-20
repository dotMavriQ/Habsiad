import { ItemView, TFolder, TFile, WorkspaceLeaf } from "obsidian";
import HabsiadPlugin from "../main"; // Ensure the path matches your project structure

import { displayGlossaryTable } from "./tabs/frontmatterGlossary";
import { DataQualityDiagnosticsView } from "./tabs/dataQualityDiagnostics";
import { AlcoholTab } from "./tabs/alcoholTab";
import { LabelsTab } from "./tabs/labelsTab";
import { LogsTab } from "./tabs/logsTab";

export const VIEW_TYPE_SIDEBAR = "habsiad-sidebar-view";

export class SidebarView extends ItemView {
  private plugin: HabsiadPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: HabsiadPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return VIEW_TYPE_SIDEBAR;
  }

  getDisplayText() {
    return "Habsiad";
  }

  getIcon() {
    return "diamond"; // Use a suitable icon
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const tabContainer = container.createDiv("habsiad-tab-container");
    // Define all possible tabs
    const allTabs = [
      { emoji: "🏡", view: "info", label: "Home" },
      { emoji: "🔎", view: "diagnostics", label: "Data Quality Diagnostics" },
      { emoji: "⬆️", view: "glossary", label: "Frontmatter Glossary" },
      { emoji: "🏷️", view: "labels", label: "Labels" },
      { emoji: "\u{1F4D4}", view: "logs", label: "Logs" },
      {
        emoji: "👟",
        view: "steps",
        label: "Steps",
        optional: true,
        settingKey: "steps",
      },
      {
        emoji: "⚖️",
        view: "weight",
        label: "Weight",
        optional: true,
        settingKey: "weight",
      },
      {
        emoji: "🍔",
        view: "calories",
        label: "Calories",
        optional: true,
        settingKey: "calories",
      },
      {
        emoji: "🍷",
        view: "alcohol",
        label: "Alcohol",
        optional: true,
        settingKey: "alcohol",
      },
    ];

    // Filter tabs based on settings
    const tabs = allTabs.filter((tab) => {
      if (tab.optional) {
        return this.plugin.settings.showTabs[
          tab.settingKey as keyof typeof this.plugin.settings.showTabs
        ];
      }
      return true;
    });

    tabs.forEach((tab) => {
      const tabButton = tabContainer.createSpan("habsiad-tab");
      tabButton.setText(tab.emoji);
      // Add tooltip to show the tab name on hover
      tabButton.setAttr("title", tab.label);
      // Ensure cursor pointer is set
      tabButton.style.cursor = "pointer";
      tabButton.onClickEvent(() => {
        this.switchTab(tab.view);
        // Remove active class from all tabs
        const allTabElements = tabContainer.querySelectorAll(".habsiad-tab");
        allTabElements.forEach((el) => el.removeClass("active"));
        // Add active class to clicked tab
        tabButton.addClass("active");
      });
    });

    // Set the first tab as active by default
    const firstTab = tabContainer.querySelector(".habsiad-tab");
    if (firstTab) firstTab.addClass("active");

    const contentArea = container.createDiv("habsiad-content-area");
    this.displayContent(contentArea, "info");
  }

  async onClose() {
    // Cleanup if necessary
  }

  private switchTab(view: string) {
    const contentArea = this.containerEl.querySelector(
      ".habsiad-content-area"
    ) as HTMLElement;
    if (contentArea) {
      contentArea.empty();
      this.displayContent(contentArea, view);
    }
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
      case "weight":
        this.displayWeightTab(container);
        break;
      case "calories":
        this.displayCaloriesTab(container);
        break;
      case "alcohol":
        this.displayAlcoholTab(container);
        break;
      case "labels":
        this.displayLabelsTab(container);
        break;
      case "logs":
        this.displayLogsTab(container);
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

    const table = container.createEl("table", { cls: "habsiad-steps-table" });
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

  private displayWeightTab(container: HTMLElement) {
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.plugin.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      container.setText(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    container.createEl("h3", { text: "Daily Weight" });

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

    const table = container.createEl("table", { cls: "habsiad-steps-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Date (YYYY/MM/DD)" });
    headerRow.createEl("th", { text: "Weight (kg)" });

    const tbody = table.createEl("tbody");

    for (const { dateString, file } of dateFileMap) {
      const metadata = this.plugin.app.metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter;
      const currentWeight = frontmatter?.weight ?? "";

      const row = tbody.createEl("tr");
      row.createEl("td", { text: dateString.replace(/-/g, "/") });

      const weightCell = row.createEl("td");
      const input = weightCell.createEl("input", {
        type: "number",
        attr: {
          step: "0.1", // Allow decimal values for more precise weight tracking
        },
      });
      if (currentWeight) {
        input.value = currentWeight.toString();
      }

      input.addEventListener("change", async () => {
        const newWeight = input.value.trim();
        console.log("Updating weight for file:", file.name, "to:", newWeight);
        await this.plugin.updateWeightFrontmatter(file, newWeight);
      });
    }
  }

  private displayCaloriesTab(container: HTMLElement) {
    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.plugin.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      container.setText(`Journal folder "${journalFolderName}" not found.`);
      return;
    }

    container.createEl("h3", { text: "Daily Calories" });

    // Add the Calculate Totals button
    const calculateButton = container.createEl("button", {
      text: "Calculate totals",
      cls: "habsiad-sync-button",
    });
    calculateButton.setAttr("style", "margin-bottom: 15px;");

    calculateButton.addEventListener("click", async () => {
      await this.plugin.calculateCalorieTotals();
    });

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

    const table = container.createEl("table", { cls: "habsiad-steps-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Date (YYYY/MM/DD)" });
    headerRow.createEl("th", { text: "Calories" });

    const tbody = table.createEl("tbody");

    for (const { dateString, file } of dateFileMap) {
      const metadata = this.plugin.app.metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter;
      const currentCalories = frontmatter?.calories ?? "";

      const row = tbody.createEl("tr");
      row.createEl("td", { text: dateString.replace(/-/g, "/") });

      const caloriesCell = row.createEl("td");
      const input = caloriesCell.createEl("input", { type: "number" });
      if (currentCalories) {
        input.value = currentCalories.toString();
      }

      input.addEventListener("change", async () => {
        const newCalories = input.value.trim();
        console.log(
          "Updating calories for file:",
          file.name,
          "to:",
          newCalories
        );
        await this.plugin.updateCaloriesFrontmatter(file, newCalories);
      });
    }
  }

  private async displayAlcoholTab(container: HTMLElement) {
    const alcoholTab = new AlcoholTab(this.app, this.plugin);
    await alcoholTab.render(container);
  }

  private async displayLabelsTab(container: HTMLElement) {
    const labelsTab = new LabelsTab(this.plugin, container);
    await labelsTab.render();
  }

  private async displayLogsTab(container: HTMLElement) {
    const logsTab = new LogsTab(this.plugin, container);
    await logsTab.render();
  }

  private displayInfoTab(container: HTMLElement) {
    const infoSection = container.createDiv("habsiad-info-section");

    // Logo container with inline SVG
    const logoContainer = infoSection.createDiv("habsiad-logo-container");
    logoContainer.innerHTML = `
      <svg class="habsiad-logo" width="180" height="240" viewBox="0 0 180 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- This creates the "carved out" effect. It cuts a hole in the shape of an H. -->
          <clipPath id="h-cutout">
            <!-- The outer rectangle defines the visible area, and the inner H-path is subtracted from it. -->
            <path d="M0,0 H180 V240 H0 Z M75,95 V145 H85 V125 H95 V145 H105 V95 H95 V115 H85 V95 Z" />
          </clipPath>
        </defs>

        <!-- Background Layer & Vase silhouette -->
        <g fill="#1c1c1c">
          <!-- Main body of the vase -->
          <path d="M50,230 C0,200 0,100 50,60 L50,40 C50,10 70,10 90,10 C110,10 130,10 130,40 L130,60 C180,100 180,200 130,230 Z" />
        </g>

        <!-- Orange-red decorative panel with the H carved out -->
        <g clip-path="url(#h-cutout)">
          <path fill="#D95737" d="M50,215 C20,190 20,110 50,80 L130,80 C160,110 160,190 130,215 Z" />
        </g>
        
        <!-- Decorative Lines -->
        <g fill="none" stroke="#1c1c1c" stroke-width="4">
            <line x1="50" y1="80" x2="130" y2="80" />
            <line x1="50" y1="215" x2="130" y2="215" />
        </g>

        <!-- Handles -->
        <g fill="#1c1c1c">
           <path d="M50,110 C25,110 25,150 50,150 L50,142 C35,142 35,118 50,118 Z" />
           <path d="M130,110 C155,110 155,150 130,150 L130,142 C145,142 145,118 130,118 Z" />
        </g>
      </svg>
    `;

    // Version info
    const pluginVersion = this.plugin.manifest.version;
    const versionEl = infoSection.createEl("p", {
      text: `Version ${pluginVersion}`,
      cls: "habsiad-version",
    });

    // Action buttons container
    const buttonsContainer = infoSection.createDiv("habsiad-buttons-container");

    // Wiki button
    const wikiButton = buttonsContainer.createEl("button", {
      text: "📖 Open Wiki",
      cls: "habsiad-action-button",
    });
    wikiButton.addEventListener("click", () => {
      window.open("https://github.com/dotMavriQ/Habsiad/wiki", "_blank");
    });

    // Settings button
    const settingsButton = buttonsContainer.createEl("button", {
      text: "⚙️ Plugin Settings",
      cls: "habsiad-action-button",
    });
    settingsButton.addEventListener("click", () => {
      // Open the plugin settings tab
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById("habsiad");
    });

    // Separator
    infoSection.createEl("hr");

    // Thank you message
    infoSection.createEl("p", { text: "Thank you for using Habsiad!" });

    // Add some spacing
    infoSection.createEl("br");

    // Donation message
    infoSection.createEl("small", {
      text: "If you benefit from this plugin and feel like contributing to its development, please consider donating:",
    });

    // Row break
    infoSection.createEl("br");

    // Donation button container using a clickable image
    const donationDiv = infoSection.createDiv("habsiad-donation");
    donationDiv.setAttr("style", "margin-top: 5px;");

    donationDiv.innerHTML =
      '<a href="https://liberapay.com/dotMavriQ/donate" target="_blank"><img alt="Donate using Liberapay" src="https://img.shields.io/liberapay/patrons/dotMavriQ.svg?logo=liberapay"></a>';
  }
}

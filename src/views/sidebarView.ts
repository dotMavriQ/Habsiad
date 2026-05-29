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
      const tabButton = tabContainer.createSpan(
        "habsiad-tab habsiad-clickable"
      );
      tabButton.setText(tab.emoji);
      // Add tooltip to show the tab name on hover
      tabButton.setAttr("title", tab.label);
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
      await this.plugin.calorieCalculations.calculateCalorieTotals();
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

    // Logo container with SVG created via DOM API
    const logoContainer = infoSection.createDiv("habsiad-logo-container");

    // Create SVG element using createElementNS for SVG namespace
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "habsiad-logo");
    svg.setAttribute("width", "180");
    svg.setAttribute("height", "240");
    svg.setAttribute("viewBox", "0 0 180 240");

    // Create defs element
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "clipPath"
    );
    clipPath.setAttribute("id", "h-cutout");
    const clipPathData = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    clipPathData.setAttribute(
      "d",
      "M0,0 H180 V240 H0 Z M75,95 V145 H85 V125 H95 V145 H105 V95 H95 V115 H85 V95 Z"
    );
    clipPath.appendChild(clipPathData);
    defs.appendChild(clipPath);

    // Background Layer & Vase silhouette
    const backgroundGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    backgroundGroup.setAttribute("fill", "#1c1c1c");
    const vasePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    vasePath.setAttribute(
      "d",
      "M50,230 C0,200 0,100 50,60 L50,40 C50,10 70,10 90,10 C110,10 130,10 130,40 L130,60 C180,100 180,200 130,230 Z"
    );
    backgroundGroup.appendChild(vasePath);

    // Orange-red decorative panel with the H carved out
    const decorativeGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    decorativeGroup.setAttribute("clip-path", "url(#h-cutout)");
    const decorativePath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    decorativePath.setAttribute("fill", "#D95737");
    decorativePath.setAttribute(
      "d",
      "M50,215 C20,190 20,110 50,80 L130,80 C160,110 160,190 130,215 Z"
    );
    decorativeGroup.appendChild(decorativePath);

    // Decorative Lines
    const linesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    linesGroup.setAttribute("fill", "none");
    linesGroup.setAttribute("stroke", "#1c1c1c");
    linesGroup.setAttribute("stroke-width", "4");
    const line1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line1.setAttribute("x1", "50");
    line1.setAttribute("y1", "80");
    line1.setAttribute("x2", "130");
    line1.setAttribute("y2", "80");
    const line2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    line2.setAttribute("x1", "50");
    line2.setAttribute("y1", "215");
    line2.setAttribute("x2", "130");
    line2.setAttribute("y2", "215");
    linesGroup.appendChild(line1);
    linesGroup.appendChild(line2);

    // Handles
    const handlesGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    handlesGroup.setAttribute("fill", "#1c1c1c");
    const handle1 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    handle1.setAttribute(
      "d",
      "M50,110 C25,110 25,150 50,150 L50,142 C35,142 35,118 50,118 Z"
    );
    const handle2 = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    handle2.setAttribute(
      "d",
      "M130,110 C155,110 155,150 130,150 L130,142 C145,142 145,118 130,118 Z"
    );
    handlesGroup.appendChild(handle1);
    handlesGroup.appendChild(handle2);

    // Assemble the SVG
    svg.appendChild(defs);
    svg.appendChild(backgroundGroup);
    svg.appendChild(decorativeGroup);
    svg.appendChild(linesGroup);
    svg.appendChild(handlesGroup);
    logoContainer.appendChild(svg);

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

    // Create donation link using DOM API instead of innerHTML
    const donationLink = donationDiv.createEl("a", {
      attr: {
        href: "https://liberapay.com/dotMavriQ/donate",
        target: "_blank",
      },
    });
    donationLink.createEl("img", {
      attr: {
        alt: "Donate using Liberapay",
        src: "https://img.shields.io/liberapay/patrons/dotMavriQ.svg?logo=liberapay",
      },
    });
  }
}

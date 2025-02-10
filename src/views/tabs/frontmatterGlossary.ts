import { ItemView, TFile, WorkspaceLeaf, TFolder, Notice } from "obsidian";

import ObsiticaPlugin from "../../main"; // Ensure the path matches your project structure

export function displayGlossaryTable(
  container: HTMLElement,
  plugin: ObsiticaPlugin
) {
  if (!container) return;

  // Clear previous content (if any)
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const table = container.createEl("table", {
    cls: "obsitica-glossary-table",
  });
  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  headerRow.createEl("th", { text: "Custom Name (Editable)" });
  headerRow.createEl("th", { text: "Frontmatter Key" });

  // Möbök / Meklubba
  const tbody = table.createEl("tbody");

  // Retrieve all unique frontmatter keys
  const uniqueKeys = getAllFrontmatterKeys(plugin);

  for (const key of uniqueKeys) {
    const row = tbody.createEl("tr");

    // Column A: Editable field for user input
    const nameCell = row.createEl("td");
    const input = nameCell.createEl("input", {
      type: "text",
      placeholder: "Enter custom name",
    });

    // Save user input persistently
    input.addEventListener("change", async () => {
      const userValue = input.value.trim();
      console.log(`Saving custom name for "${key}":`, userValue);
      await plugin.saveCustomFrontmatterName(key, userValue); // Add saving logic in the plugin class
    });

    // Column B: Locked field displaying the frontmatter key
    const keyCell = row.createEl("td");
    keyCell.setText(key); // Display the frontmatter key
    keyCell.addClass("locked"); // Optional: Add CSS class for styling
  }
}

function getAllFrontmatterKeys(plugin: ObsiticaPlugin): string[] {
  const journalFolderName = plugin.settings.journalFolderName || "Journal";
  const journalFolder =
    plugin.app.vault.getAbstractFileByPath(journalFolderName);

  if (!journalFolder || !(journalFolder instanceof TFolder)) {
    return [];
  }

  const files = journalFolder.children.filter(
    (f) => f instanceof TFile && f.extension === "md"
  ) as TFile[];

  const currentYear = new Date().getFullYear();
  const journalFiles = files.filter((file) =>
    file.name.startsWith(`${currentYear}-`)
  );

  const frontmatterKeys = new Set<string>();

  for (const file of journalFiles) {
    const metadata = plugin.app.metadataCache.getFileCache(file);
    if (metadata?.frontmatter) {
      Object.keys(metadata.frontmatter).forEach((key) =>
        frontmatterKeys.add(key)
      );
    }
  }

  return [...frontmatterKeys];
}

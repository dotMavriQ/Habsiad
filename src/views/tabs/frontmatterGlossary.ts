import { TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

let glossaryMapping: { [key: string]: string } = {};
const glossaryFileName = "frontmatterGlossary.json";
// Hardcoded folder name since your plugin folder is "Habsiad"
const pluginFolder = ".obsidian/plugins/Habsiad";

/**
 * Loads the glossary mapping from frontmatterGlossary.json.
 * If the file doesn't exist, it creates an empty mapping and writes it.
 */
async function loadGlossaryMapping(plugin: HabsiadPlugin): Promise<void> {
  const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
  try {
    const data = await plugin.app.vault.adapter.read(glossaryPath);
    glossaryMapping = JSON.parse(data);
    console.log("Loaded glossary mapping:", glossaryMapping);
  } catch (error) {
    console.warn(
      "Glossary file not found or unreadable. Creating a new one.",
      error
    );
    glossaryMapping = {};
    await saveGlossaryMapping(plugin);
  }
}

/**
 * Saves the current glossary mapping to frontmatterGlossary.json with 4-space indentation.
 */
async function saveGlossaryMapping(plugin: HabsiadPlugin): Promise<void> {
  const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
  const json = JSON.stringify(glossaryMapping, null, 4);
  await plugin.app.vault.adapter.write(glossaryPath, json);
  console.log("Saved glossary mapping:", glossaryMapping);
}

/**
 * Returns the Habitica key for a given frontmatter key.
 */
export function getHabiticaKey(key: string): string {
  return glossaryMapping[key] || "";
}

/**
 * Saves a Habitica key for a given frontmatter key.
 */
export async function saveHabiticaKey(
  plugin: HabsiadPlugin,
  key: string,
  value: string
): Promise<void> {
  glossaryMapping[key] = value;
  console.log(`Saving Habitica key for frontmatter key "${key}":`, value);
  await saveGlossaryMapping(plugin);
}

function getAllFrontmatterKeys(plugin: HabsiadPlugin): string[] {
  const journalFolderName = plugin.settings.journalFolderName || "Journal";
  const journalFolder =
    plugin.app.vault.getAbstractFileByPath(journalFolderName);

  if (!journalFolder || !(journalFolder instanceof TFolder)) {
    console.warn("Journal folder not found:", journalFolderName);
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

/**
 * Displays the glossary table in the provided container element.
 * The left column is now labeled "Habitica Key" and is editable,
 * while the right column displays the corresponding frontmatter key.
 */
export async function displayGlossaryTable(
  container: HTMLElement,
  plugin: HabsiadPlugin
) {
  await loadGlossaryMapping(plugin);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  
  // Add the sync button at the top
  const syncButton = container.createEl("button", {
    text: "Sync Habitica to Frontmatter",
    cls: "habsiad-sync-button",
  });
  syncButton.setAttr("style", "margin-bottom: 15px;");
  
  
  syncButton.addEventListener("click", () => {
    plugin.syncHabiticaToFrontmatter();
  });

  const table = container.createEl("table", {
    cls: "habsiad-glossary-table",
  });
  const thead = table.createEl("thead");
  const headerRow = thead.createEl("tr");
  // Updated header text:
  headerRow.createEl("th", { text: "Habitica Key" });
  headerRow.createEl("th", { text: "Frontmatter Key" });

  const tbody = table.createEl("tbody");
  const uniqueKeys = getAllFrontmatterKeys(plugin);
  console.log("Unique frontmatter keys:", uniqueKeys);

  if (uniqueKeys.length === 0) {
    const row = tbody.createEl("tr");
    const cell = row.createEl("td", { text: "No frontmatter keys found." });
    cell.colSpan = 2;
  } else {
    for (const key of uniqueKeys) {
      const row = tbody.createEl("tr");

      // Column A: Editable field for the Habitica key.
      const nameCell = row.createEl("td");
      const input = nameCell.createEl("input", {
        type: "text",
        placeholder: "Enter Habitica key",
        value: getHabiticaKey(key),
      });

      input.addEventListener("change", async () => {
        const userValue = input.value.trim();
        console.log(
          `User entered Habitica key for frontmatter key "${key}":`,
          userValue
        );
        await saveHabiticaKey(plugin, key, userValue);
      });

      // Column B: Read-only display of the frontmatter key.
      const keyCell = row.createEl("td");
      keyCell.setText(key);
      keyCell.addClass("locked");
    }
  }
}

import { Notice, TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

interface GlossaryEntry {
  habiticaKey: string;
  isDisabled: boolean;
}

type GlossaryMapping = { [key: string]: GlossaryEntry };

let glossaryMapping: GlossaryMapping = {};
const glossaryFileName = "frontmatterGlossary.json";

// Shown in the Habitica-key field when an entry is locked (not gathered from
// Habitica). Kept as a constant so it's never mistaken for a real saved value.
const DISABLED_PLACEHOLDER = "Data is not gathered from Habitica";


/**
 * Loads the glossary mapping from frontmatterGlossary.json.
 * If the file doesn't exist, it creates an empty mapping and writes it.
 * Handles migration from old string-based format to new object format.
 */
async function loadGlossaryMapping(plugin: HabsiadPlugin): Promise<void> {
  const pluginFolder = plugin.getPluginDir();
  const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
  try {
    const data = await plugin.app.vault.adapter.read(glossaryPath);
    const parsedData = JSON.parse(data);

    // Handle migration from old format (string values) to new format (object values)
    if (Object.keys(parsedData).length > 0) {
      const firstValue = Object.values(parsedData)[0];
      if (typeof firstValue === "string") {
        // Migrate old format to new format
        console.log("Migrating glossary from old format to new format");
        for (const [key, value] of Object.entries(parsedData)) {
          glossaryMapping[key] = {
            habiticaKey: value as string,
            isDisabled: false,
          };
        }
        await saveGlossaryMapping(plugin); // Save in new format
      } else {
        // Already in new format
        glossaryMapping = parsedData;
      }
    } else {
      glossaryMapping = {};
    }

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
  const pluginFolder = plugin.getPluginDir();
  const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
  const json = JSON.stringify(glossaryMapping, null, 4);
  await plugin.app.vault.adapter.write(glossaryPath, json);
  console.log("Saved glossary mapping:", glossaryMapping);
}

/**
 * Returns the Habitica key for a given frontmatter key.
 */
export function getHabiticaKey(key: string): string {
  return glossaryMapping[key]?.habiticaKey || "";
}

/**
 * Returns whether a frontmatter key is marked as disabled (not gathered from Habitica).
 */
export function isKeyDisabled(key: string): boolean {
  return glossaryMapping[key]?.isDisabled || false;
}

/**
 * Sets the disabled state for a frontmatter key.
 */
export async function setKeyDisabled(
  plugin: HabsiadPlugin,
  key: string,
  disabled: boolean
): Promise<void> {
  if (!glossaryMapping[key]) {
    glossaryMapping[key] = { habiticaKey: "", isDisabled: false };
  }
  glossaryMapping[key].isDisabled = disabled;
  console.log(`Set disabled state for "${key}":`, disabled);
  await saveGlossaryMapping(plugin);
}

/**
 * Saves a Habitica key for a given frontmatter key.
 */
export async function saveHabiticaKey(
  plugin: HabsiadPlugin,
  key: string,
  value: string
): Promise<void> {
  if (!glossaryMapping[key]) {
    glossaryMapping[key] = { habiticaKey: "", isDisabled: false };
  }
  glossaryMapping[key].habiticaKey = value;
  console.log(`Saving Habitica key for frontmatter key "${key}":`, value);
  await saveGlossaryMapping(plugin);
}

/**
 * Validates and normalizes arbitrary parsed JSON into the glossary mapping
 * shape, migrating legacy string values to { habiticaKey, isDisabled }.
 */
function normalizeGlossaryData(data: unknown): GlossaryMapping {
  if (!data || typeof data !== "object") {
    throw new Error("Glossary data must be a JSON object");
  }
  const normalized: GlossaryMapping = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value === "string") {
      normalized[key] = { habiticaKey: value, isDisabled: false };
      continue;
    }
    if (value && typeof value === "object") {
      const entry = value as Partial<GlossaryEntry>;
      const habiticaKey =
        typeof entry.habiticaKey === "string" ? entry.habiticaKey : "";
      const isDisabled =
        typeof entry.isDisabled === "boolean" ? entry.isDisabled : false;
      normalized[key] = { habiticaKey, isDisabled };
      continue;
    }
    throw new Error(
      `Invalid glossary entry for key "${key}". Expected string or object.`
    );
  }
  return normalized;
}

/**
 * Returns the current glossary as a pretty-printed JSON string.
 */
export async function getGlossaryJson(plugin: HabsiadPlugin): Promise<string> {
  await loadGlossaryMapping(plugin);
  return JSON.stringify(glossaryMapping, null, 4);
}

/**
 * Replaces the glossary with the supplied JSON string and persists it.
 */
export async function applyGlossaryJson(
  plugin: HabsiadPlugin,
  json: string
): Promise<void> {
  const parsed = JSON.parse(json);
  const normalized = normalizeGlossaryData(parsed);
  glossaryMapping = normalized;
  await saveGlossaryMapping(plugin);
}

// A plain, predictable file at the vault root. Export writes it, import reads
// it, and Obsidian sync carries it between devices -- no native OS dialogs,
// no arbitrary filesystem paths, and it works on mobile.
const glossaryExportFile = "frontmatterGlossary.json";

async function exportGlossary(plugin: HabsiadPlugin): Promise<void> {
  try {
    await loadGlossaryMapping(plugin);
    const output = JSON.stringify(glossaryMapping, null, 4);
    await plugin.app.vault.adapter.write(glossaryExportFile, output);
    new Notice(`Glossary exported to "${glossaryExportFile}" in your vault.`);
    console.log("Glossary exported to", glossaryExportFile);
  } catch (error) {
    console.error("Failed to export glossary:", error);
    new Notice("Failed to export glossary. See console for details.");
  }
}

async function importGlossary(plugin: HabsiadPlugin): Promise<boolean> {
  try {
    const exists = await plugin.app.vault.adapter.exists(glossaryExportFile);
    if (!exists) {
      new Notice(
        `No "${glossaryExportFile}" found in your vault. Export from another ` +
          `device first, or use Settings → Paste Glossary JSON.`
      );
      return false;
    }
    const fileContents = await plugin.app.vault.adapter.read(glossaryExportFile);
    const parsed = JSON.parse(fileContents);
    const normalized = normalizeGlossaryData(parsed);
    glossaryMapping = normalized;
    await saveGlossaryMapping(plugin);
    new Notice(`Glossary imported from "${glossaryExportFile}".`);
    console.log("Glossary imported from", glossaryExportFile);
    return true;
  } catch (error) {
    console.error("Failed to import glossary:", error);
    new Notice("Invalid glossary JSON. See console for details.");
    return false;
  }
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

  // Action buttons container
  const actionBar = container.createDiv({ cls: "habsiad-glossary-actions" });
  const syncButton = actionBar.createEl("button", {
    text: "Sync Habitica to Frontmatter",
    cls: "habsiad-sync-button",
  });
  syncButton.addEventListener("click", () => {
    plugin.syncHabiticaToFrontmatter();
  });

  const exportButton = actionBar.createEl("button", {
    text: "Export Glossary",
    cls: "habsiad-export-button",
  });
  exportButton.addEventListener("click", async () => {
    await exportGlossary(plugin);
  });

  const importButton = actionBar.createEl("button", {
    text: "Import Glossary",
    cls: "habsiad-import-button",
  });
  importButton.addEventListener("click", async () => {
    const didImport = await importGlossary(plugin);
    if (didImport) {
      await displayGlossaryTable(container, plugin);
    }
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

      // Column B: Clickable frontmatter key that locks/unlocks the entry.
      const keyCell = row.createEl("td");
      keyCell.setText(key);
      keyCell.addClass("locked");
      keyCell.addClass("clickable-frontmatter-key");

      // Paint the row from the live stored state. Three mutually exclusive
      // states: has a Habitica key (protected), locked (disabled), or empty.
      const applyState = () => {
        const value = getHabiticaKey(key).trim();
        const disabled = isKeyDisabled(key);

        keyCell.removeClass("habsiad-disabled");
        keyCell.removeClass("protected-entry");
        keyCell.removeClass("habsiad-clickable");
        keyCell.removeClass("habsiad-highlighted-cell");

        if (value.length > 0) {
          // Protected: an entry with a Habitica key can't be locked.
          keyCell.addClass("habsiad-disabled");
          keyCell.addClass("protected-entry");
          input.disabled = false;
          input.removeClass("habsiad-input-placeholder");
          if (input.value === DISABLED_PLACEHOLDER) input.value = value;
        } else if (disabled) {
          // Locked: still clickable so it can always be unlocked again.
          keyCell.addClass("habsiad-clickable");
          keyCell.addClass("habsiad-highlighted-cell");
          input.value = DISABLED_PLACEHOLDER;
          input.disabled = true;
          input.addClass("habsiad-input-placeholder");
        } else {
          // Empty: free to type a key or click to lock.
          keyCell.addClass("habsiad-clickable");
          input.disabled = false;
          input.removeClass("habsiad-input-placeholder");
          if (input.value === DISABLED_PLACEHOLDER) input.value = "";
        }
      };

      input.addEventListener("change", async () => {
        if (input.disabled) return;
        let userValue = input.value.trim();
        if (userValue === DISABLED_PLACEHOLDER) userValue = "";
        await saveHabiticaKey(plugin, key, userValue);
        // A real key wins over a stale lock, keeping the two states exclusive.
        if (userValue.length > 0 && isKeyDisabled(key)) {
          await setKeyDisabled(plugin, key, false);
        }
        applyState();
      });

      keyCell.addEventListener("click", async () => {
        const value = getHabiticaKey(key).trim();
        if (isKeyDisabled(key)) {
          await setKeyDisabled(plugin, key, false); // unlocking is always allowed
        } else if (value.length > 0) {
          new Notice("Clear the Habitica key before locking this entry.");
        } else {
          await setKeyDisabled(plugin, key, true);
        }
        applyState();
      });

      applyState();
    }
  }
}

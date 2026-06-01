import { FileSystemAdapter, Notice, TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

interface GlossaryEntry {
  habiticaKey: string;
  isDisabled: boolean;
}

type GlossaryMapping = { [key: string]: GlossaryEntry };

let glossaryMapping: GlossaryMapping = {};
const glossaryFileName = "frontmatterGlossary.json";

/**
 * Resolves an Electron/Node module via the desktop runtime's `require`.
 * Returns null on mobile or when the module is unavailable.
 */
function getElectronModule(moduleName: string): any {
  const electronRequire = (window as any).require;
  if (typeof electronRequire !== "function") {
    return null;
  }
  try {
    return electronRequire(moduleName);
  } catch (error) {
    console.warn(`Failed to load ${moduleName}:`, error);
    return null;
  }
}

function getElectronDialog(): any {
  const remote = getElectronModule("@electron/remote");
  if (remote?.dialog) {
    return remote.dialog;
  }
  const electron = getElectronModule("electron");
  if (electron?.dialog) {
    return electron.dialog;
  }
  if (electron?.remote?.dialog) {
    return electron.remote.dialog;
  }
  return null;
}

function getNodeFs(): any {
  const fsModule = getElectronModule("fs");
  if (fsModule?.promises) {
    return fsModule.promises;
  }
  return null;
}

/**
 * Loads the glossary mapping from frontmatterGlossary.json.
 * If the file doesn't exist, it creates an empty mapping and writes it.
 * Handles migration from old string-based format to new object format.
 */
async function loadGlossaryMapping(plugin: HabsiadPlugin): Promise<void> {
  const pluginFolder = `${plugin.app.vault.configDir}/plugins/habsiad`;
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
  const pluginFolder = `${plugin.app.vault.configDir}/plugins/habsiad`;
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

function getDefaultDialogPath(
  plugin: HabsiadPlugin,
  fileName: string
): string | undefined {
  const adapter = plugin.app.vault.adapter;
  if (adapter instanceof FileSystemAdapter) {
    const pathModule = (window as any).require?.("path");
    if (pathModule) {
      return pathModule.join(adapter.getBasePath(), fileName);
    }
  }
  return undefined;
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

async function exportGlossary(plugin: HabsiadPlugin): Promise<void> {
  try {
    const dialog = getElectronDialog();
    const fs = getNodeFs();
    if (!dialog || !fs) {
      new Notice("Export is available only on the desktop app.");
      return;
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[:T]/g, "-")
      .split(".")[0];
    const defaultPath = getDefaultDialogPath(
      plugin,
      `frontmatterGlossary-${timestamp}.json`
    );
    const result = await dialog.showSaveDialog({
      title: "Export Habsiad Frontmatter Glossary",
      defaultPath,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (result.canceled || !result.filePath) {
      new Notice("Glossary export cancelled.");
      return;
    }
    await loadGlossaryMapping(plugin);
    const output = JSON.stringify(glossaryMapping, null, 4);
    await fs.writeFile(result.filePath, output, "utf8");
    new Notice("Glossary exported successfully.");
    console.log("Glossary exported to", result.filePath);
  } catch (error) {
    console.error("Failed to export glossary:", error);
    new Notice("Failed to export glossary. See console for details.");
  }
}

async function importGlossary(plugin: HabsiadPlugin): Promise<boolean> {
  try {
    const dialog = getElectronDialog();
    const fs = getNodeFs();
    if (!dialog || !fs) {
      new Notice("Import is available only on the desktop app.");
      return false;
    }
    const defaultPath = getDefaultDialogPath(plugin, "frontmatterGlossary.json");
    const result = await dialog.showOpenDialog({
      title: "Import Habsiad Frontmatter Glossary",
      defaultPath,
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile"],
    });
    const filePath = result.filePaths?.[0];
    if (result.canceled || !filePath) {
      new Notice("Glossary import cancelled.");
      return false;
    }
    const fileContents = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContents);
    const normalized = normalizeGlossaryData(parsed);
    glossaryMapping = normalized;
    await saveGlossaryMapping(plugin);
    new Notice("Glossary imported successfully.");
    console.log("Glossary imported from", filePath);
    return true;
  } catch (error) {
    console.error("Failed to import glossary:", error);
    new Notice("Failed to import glossary. See console for details.");
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

      input.addEventListener("change", async () => {
        const userValue = input.value.trim();
        console.log(
          `User entered Habitica key for frontmatter key "${key}":`,
          userValue
        );
        await saveHabiticaKey(plugin, key, userValue);
      });

      // Column B: Clickable frontmatter key that can lock the input field.
      const keyCell = row.createEl("td");
      keyCell.setText(key);
      keyCell.addClass("locked");
      keyCell.addClass("clickable-frontmatter-key");

      // Check if this key has a stored Habitica value (protection mode)
      const hasStoredValue = getHabiticaKey(key).trim().length > 0;
      const isCurrentlyDisabled = isKeyDisabled(key);

      if (hasStoredValue) {
        // Protected mode: entries with values can't be clicked to disable
        keyCell.addClass("habsiad-disabled");
        keyCell.classList.add("protected-entry");
      } else {
        // Normal mode: empty entries can be clicked to toggle disabled state
        keyCell.addClass("habsiad-clickable");

        // Initialize the display based on stored disabled state
        if (isCurrentlyDisabled) {
          input.value = "Data is not gathered from Habitica";
          input.disabled = true;
          input.addClass("habsiad-input-placeholder");
          keyCell.addClass("habsiad-highlighted-cell");
        }

        keyCell.addEventListener("click", async () => {
          // Double-check that no value was added since initialization
          const currentValue = getHabiticaKey(key).trim();
          if (currentValue.length > 0) {
            // Value was added, switch to protected mode
            keyCell.removeClass("habsiad-clickable");
            keyCell.addClass("habsiad-disabled");
            keyCell.classList.add("protected-entry");
            return;
          }

          const currentlyDisabled = isKeyDisabled(key);

          if (!currentlyDisabled) {
            // Lock the input field and save state
            input.value = "Data is not gathered from Habitica";
            input.disabled = true;
            input.addClass("habsiad-input-placeholder");
            keyCell.addClass("habsiad-highlighted-cell");
            await setKeyDisabled(plugin, key, true);
          } else {
            // Unlock the input field and save state
            input.value = "";
            input.disabled = false;
            input.removeClass("habsiad-input-placeholder");
            keyCell.removeClass("habsiad-highlighted-cell");
            await setKeyDisabled(plugin, key, false);
          }
        });
      }
    }
  }
}

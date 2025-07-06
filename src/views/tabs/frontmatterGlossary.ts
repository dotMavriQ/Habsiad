import { TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

interface GlossaryEntry {
  habiticaKey: string;
  isDisabled: boolean;
}

let glossaryMapping: { [key: string]: GlossaryEntry } = {};
const glossaryFileName = "frontmatterGlossary.json";
// Hardcoded folder name since your plugin folder is "Habsiad"
const pluginFolder = ".obsidian/plugins/Habsiad";

/**
 * Loads the glossary mapping from frontmatterGlossary.json.
 * If the file doesn't exist, it creates an empty mapping and writes it.
 * Handles migration from old string-based format to new object format.
 */
async function loadGlossaryMapping(plugin: HabsiadPlugin): Promise<void> {
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
        keyCell.style.cursor = "not-allowed";
        keyCell.style.opacity = "0.6";
        keyCell.classList.add("protected-entry");
      } else {
        // Normal mode: empty entries can be clicked to toggle disabled state
        keyCell.style.cursor = "pointer";

        // Initialize the display based on stored disabled state
        if (isCurrentlyDisabled) {
          input.value = "Data is not gathered from Habitica";
          input.disabled = true;
          input.style.fontStyle = "italic";
          input.style.color = "var(--text-muted)";
          input.style.backgroundColor =
            "var(--background-modifier-form-field-highlighted)";
          keyCell.style.backgroundColor = "var(--background-modifier-accent)";
        }

        keyCell.addEventListener("click", async () => {
          // Double-check that no value was added since initialization
          const currentValue = getHabiticaKey(key).trim();
          if (currentValue.length > 0) {
            // Value was added, switch to protected mode
            keyCell.style.cursor = "not-allowed";
            keyCell.style.opacity = "0.6";
            keyCell.classList.add("protected-entry");
            return;
          }

          const currentlyDisabled = isKeyDisabled(key);

          if (!currentlyDisabled) {
            // Lock the input field and save state
            input.value = "Data is not gathered from Habitica";
            input.disabled = true;
            input.style.fontStyle = "italic";
            input.style.color = "var(--text-muted)";
            input.style.backgroundColor =
              "var(--background-modifier-form-field-highlighted)";
            keyCell.style.backgroundColor = "var(--background-modifier-accent)";
            await setKeyDisabled(plugin, key, true);
          } else {
            // Unlock the input field and save state
            input.value = "";
            input.disabled = false;
            input.style.fontStyle = "";
            input.style.color = "";
            input.style.backgroundColor = "";
            keyCell.style.backgroundColor = "";
            await setKeyDisabled(plugin, key, false);
          }
        });
      }
    }
  }
}

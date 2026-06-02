/**
 * Helpers for the two Habitica-generated journal sections,
 * "## Achievements on <date>" and "## Completed Dailies".
 *
 * Both the live sync and RetroTagger keep exactly one copy of each section and
 * place them at the BOTTOM of the note -- never at the cursor. These helpers
 * pull the existing sections out and rebuild them cleanly at the end.
 *
 * A line only counts as a section header when it is EXACTLY that header on its
 * own line. That deliberately ignores headers that an older cursor-based insert
 * may have glued into the middle of a paragraph, so we never delete real prose.
 */

export interface ExtractedSections {
  /** The note with both sections stripped and trailing whitespace trimmed. */
  body: string;
  /** Achievement item text (the part after "* "), counts preserved. */
  achievements: string[];
  /** Completed-daily names (the part after "* "). */
  dailies: string[];
}

export function extractHabiticaSections(
  content: string,
  date: string
): ExtractedSections {
  const achHeader = `## Achievements on ${date}`;
  const dailiesHeader = "## Completed Dailies";

  const kept: string[] = [];
  const achievements: string[] = [];
  const dailies: string[] = [];
  let mode: "none" | "ach" | "daily" = "none";

  const bulletText = (line: string): string | null => {
    const m = line.match(/^\*\s+(.+?)\s*$/);
    return m ? m[1].trim() : null;
  };

  for (const line of content.split("\n")) {
    if (line === achHeader) {
      mode = "ach";
      continue; // drop the header itself
    }
    if (line === dailiesHeader) {
      mode = "daily";
      continue;
    }
    if (/^## /.test(line)) {
      // Any other "## " heading closes a section we were collecting.
      mode = "none";
      kept.push(line);
      continue;
    }

    if (mode === "ach") {
      const item = bulletText(line);
      if (item !== null) {
        achievements.push(item);
        continue;
      }
      if (line.trim() === "") continue; // swallow blank lines inside the section
      mode = "none"; // anything else ends the section; keep the line
      kept.push(line);
      continue;
    }

    if (mode === "daily") {
      const item = bulletText(line);
      if (item !== null) {
        if (!item.includes(" - Positive:")) dailies.push(item);
        continue;
      }
      if (line.trim() === "") continue;
      mode = "none";
      kept.push(line);
      continue;
    }

    kept.push(line);
  }

  return {
    body: kept.join("\n").replace(/\s+$/, ""),
    achievements,
    dailies,
  };
}

export function buildHabiticaBlock(
  date: string,
  achievements: string[],
  dailies: string[]
): string {
  const ach = achievements.map((item) => `* ${item}`).join("\n");
  const daily = dailies.map((item) => `* ${item}`).join("\n");
  return `## Achievements on ${date}\n${ach}\n\n## Completed Dailies\n${daily}`;
}

/**
 * Returns the note with both sections rebuilt once, appended at the bottom.
 */
export function withSectionsAtBottom(
  content: string,
  date: string,
  achievements: string[],
  dailies: string[]
): string {
  const { body } = extractHabiticaSections(content, date);
  const block = buildHabiticaBlock(date, achievements, dailies);
  return body.length ? `${body}\n\n${block}\n` : `${block}\n`;
}

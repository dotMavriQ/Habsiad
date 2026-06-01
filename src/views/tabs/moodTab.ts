import { App, TFile, TFolder } from "obsidian";
import HabsiadPlugin from "../../main";

/**
 * Ordered emotion scale, best -> worst. A grapheme only counts towards the mood
 * graph if it appears here, which filters out incidental emojis/digits. Index in
 * this (de-duplicated) list is the emoji's "goodness rank": 0 = best (plotted at
 * the top), higher = worse (plotted lower).
 */
const EMOTION_SCALE_RAW = [
  "😇", "🥰", "😍", "😊", "😁", "😄", "😃", "😆", "😂", "🤣", "😋", "😎", "🤩",
  "😌", "😉", "😏", "😙", "😘", "🥳", "😜", "😛", "😝", "🤗", "🫶", "🤭", "😚",
  "🤔", "🧐", "😮", "😯", "😲", "🤨", "😐", "😑", "😶", "🙃", "😒", "🙄", "😬",
  "🤥", "😔", "☹️", "😕", "🤯", "😖", "😞", "😟", "😣", "😩", "🥺", "😢", "😭",
  "😤", "😠", "😡", "🤬", "🥵", "🥶", "😰", "😨", "😱", "😳", "😓", "😥", "🤕",
  "🤒", "😷", "🤧", "🥴", "😴", "🤢", "🤮", "😵", "😵‍💫", "💀", "☠️",
];

// De-duplicate while preserving order (the raw list has a couple of repeats).
const EMOTION_SCALE: string[] = Array.from(new Set(EMOTION_SCALE_RAW));
const EMOTION_RANK: Map<string, number> = new Map(
  EMOTION_SCALE.map((emoji, i) => [emoji, i])
);

const QUARTER_NAMES = [
  ["Jan", "Mar"],
  ["Apr", "Jun"],
  ["Jul", "Sep"],
  ["Oct", "Dec"],
];

interface MoodPoint {
  date: string; // YYYY-MM-DD
  time: number; // ms timestamp used for x ordering (day start + per-emoji offset)
  emoji: string;
  rank: number; // index in EMOTION_SCALE (0 = best)
  quarter: number; // year*4 + quarter index
  file: TFile;
}

interface DayMoods {
  date: string;
  file: TFile;
  emojis: string[]; // in order of appearance
  quarter: number;
}

export class MoodTab {
  private app: App;
  private plugin: HabsiadPlugin;
  private resizeObserver?: ResizeObserver;

  private allPoints: MoodPoint[] = [];
  private allDays: DayMoods[] = [];
  private quarters: number[] = []; // sorted asc, only quarters with data
  private currentIndex = 0;

  // Re-rendered per page.
  private rangeLabel?: HTMLElement;
  private prevBtn?: HTMLButtonElement;
  private nextBtn?: HTMLButtonElement;
  private graphWrapper?: HTMLElement;
  private listWrapper?: HTMLElement;

  constructor(app: App, plugin: HabsiadPlugin) {
    this.app = app;
    this.plugin = plugin;
  }

  async render(container: HTMLElement): Promise<void> {
    container.empty();

    const journalFolderName =
      this.plugin.settings.journalFolderName || "Journal";
    const journalFolder =
      this.app.vault.getAbstractFileByPath(journalFolderName);

    if (!journalFolder || !(journalFolder instanceof TFolder)) {
      container.createEl("p", {
        text: `Journal folder "${journalFolderName}" not found.`,
        cls: "habsiad-error-message",
      });
      return;
    }

    container.createEl("h3", { text: "Mood Index" });

    await this.collectMoods(journalFolder);

    if (this.allPoints.length === 0) {
      container.createEl("p", {
        text: "No mood emojis found in your journal Summary/Reflections sections.",
        cls: "habsiad-no-data",
      });
      return;
    }

    // Quarters that actually contain data, newest selected by default.
    this.quarters = Array.from(
      new Set(this.allDays.map((d) => d.quarter))
    ).sort((a, b) => a - b);
    this.currentIndex = this.quarters.length - 1;

    // Pagination header (◀ older / newer ▶).
    const nav = container.createDiv("habsiad-mood-nav");
    this.prevBtn = nav.createEl("button", {
      text: "◀",
      cls: "habsiad-mood-nav-btn",
    });
    this.prevBtn.setAttr("title", "Older quarter");
    this.rangeLabel = nav.createEl("span", { cls: "habsiad-mood-range" });
    this.nextBtn = nav.createEl("button", {
      text: "▶",
      cls: "habsiad-mood-nav-btn",
    });
    this.nextBtn.setAttr("title", "Newer quarter");

    this.prevBtn.addEventListener("click", () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderWindow();
      }
    });
    this.nextBtn.addEventListener("click", () => {
      if (this.currentIndex < this.quarters.length - 1) {
        this.currentIndex++;
        this.renderWindow();
      }
    });

    this.graphWrapper = container.createDiv("habsiad-mood-graph");
    this.listWrapper = container.createDiv("habsiad-mood-list");

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver?.disconnect();
      let pending = 0;
      this.resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(pending);
        pending = window.setTimeout(() => {
          if (this.graphWrapper) this.drawGraph(this.graphWrapper);
        }, 120);
      });
      this.resizeObserver.observe(this.graphWrapper);
    }

    this.renderWindow();
  }

  /** Detach the resize observer (called when the tab is torn down). */
  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
  }

  // --- Pagination ----------------------------------------------------------

  private currentQuarter(): number {
    return this.quarters[this.currentIndex];
  }

  private windowPoints(): MoodPoint[] {
    const q = this.currentQuarter();
    return this.allPoints.filter((p) => p.quarter === q);
  }

  private windowDays(): DayMoods[] {
    const q = this.currentQuarter();
    return this.allDays.filter((d) => d.quarter === q);
  }

  private renderWindow(): void {
    if (this.rangeLabel) {
      this.rangeLabel.setText(this.quarterLabel(this.currentQuarter()));
    }
    if (this.prevBtn) this.prevBtn.disabled = this.currentIndex <= 0;
    if (this.nextBtn) {
      this.nextBtn.disabled = this.currentIndex >= this.quarters.length - 1;
    }
    if (this.graphWrapper) this.drawGraph(this.graphWrapper);
    if (this.listWrapper) this.drawList(this.listWrapper);
  }

  private quarterOf(date: string): number {
    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(5, 7), 10);
    return year * 4 + Math.floor((month - 1) / 3);
  }

  private quarterLabel(q: number): string {
    const year = Math.floor(q / 4);
    const qi = q % 4;
    return `${QUARTER_NAMES[qi][0]}–${QUARTER_NAMES[qi][1]} ${year}`;
  }

  // --- Data collection -----------------------------------------------------

  private async collectMoods(root: TFolder): Promise<void> {
    const files = this.collectJournalFiles(root);
    const points: MoodPoint[] = [];
    const days: DayMoods[] = [];

    for (const file of files) {
      const match = file.basename.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!match) continue;
      const date = match[0];
      const quarter = this.quarterOf(date);
      const dayStart = new Date(`${date}T00:00:00`).getTime();

      let content: string;
      try {
        content = await this.app.vault.cachedRead(file);
      } catch (error) {
        console.warn(`Habsiad Mood: could not read ${file.path}`, error);
        continue;
      }

      const emojis = this.extractMoodEmojis(content);
      if (emojis.length === 0) continue;

      days.push({ date, file, emojis, quarter });
      emojis.forEach((emoji, i) => {
        points.push({
          date,
          time: dayStart + i * 60000,
          emoji,
          rank: EMOTION_RANK.get(emoji) as number,
          quarter,
          file,
        });
      });
    }

    points.sort((a, b) => a.time - b.time);
    days.sort((a, b) => b.date.localeCompare(a.date));
    this.allPoints = points;
    this.allDays = days;
  }

  /** Recursively gather YYYY-MM-DD.md files (journals live in root and year subfolders). */
  private collectJournalFiles(folder: TFolder): TFile[] {
    const out: TFile[] = [];
    const walk = (f: TFolder) => {
      for (const child of f.children) {
        if (child instanceof TFolder) {
          walk(child);
        } else if (
          child instanceof TFile &&
          child.extension === "md" &&
          /^\d{4}-\d{2}-\d{2}$/.test(child.basename)
        ) {
          out.push(child);
        }
      }
    };
    walk(folder);
    return out;
  }

  /**
   * Extract emojis (in order) from the Summary and Reflections sections only,
   * keeping just those on the emotion scale.
   */
  private extractMoodEmojis(content: string): string[] {
    const lines = content.split("\n");
    let inSummary = false;
    let inReflections = false;
    let text = "";

    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("###### Summary:")) {
        inSummary = true;
        inReflections = false;
        continue;
      }
      if (line.startsWith("### Reflections:")) {
        inReflections = true;
        inSummary = false;
        continue;
      }
      // A new header closes the current section.
      if (inSummary && line.startsWith("#")) inSummary = false;
      if (inReflections && line.startsWith("###")) inReflections = false;

      if (inSummary) text += " " + line;
      if (inReflections && line.startsWith("-")) text += " " + line;
    }

    return this.graphemes(text).filter((g) => EMOTION_RANK.has(g));
  }

  /** Split into grapheme clusters so ZWJ/variation-selector emojis stay intact. */
  private graphemes(text: string): string[] {
    const Segmenter = (Intl as any)?.Segmenter;
    if (Segmenter) {
      const seg = new Segmenter("en", { granularity: "grapheme" });
      return Array.from(seg.segment(text), (s: any) => s.segment as string);
    }
    return Array.from(text);
  }

  // --- Graph ---------------------------------------------------------------

  private drawGraph(wrapper: HTMLElement): void {
    wrapper.empty();
    const data = this.windowPoints();
    if (data.length === 0) {
      wrapper.createEl("p", {
        text: "No mood emojis in this period.",
        cls: "habsiad-no-data",
      });
      return;
    }

    const cssWidth = wrapper.clientWidth || 600;
    const wide = cssWidth >= 900;
    const margin = { top: 16, right: 16, bottom: 44, left: 28 };
    const width = Math.max(240, cssWidth - margin.left - margin.right);
    const plotH = wide ? 520 : 320;
    const height = plotH + margin.top + margin.bottom;

    const svg = wrapper.createSvg("svg", {
      attr: {
        width: "100%",
        height: `${height}`,
        viewBox: `0 0 ${cssWidth} ${height}`,
      },
      cls: "habsiad-mood-svg",
    });

    // Vertical gradient backdrop: green (good) at top -> red (bad) at bottom.
    const defs = svg.createSvg("defs");
    const grad = defs.createSvg("linearGradient", {
      attr: { id: "habsiadMoodGradient", x1: "0", y1: "0", x2: "0", y2: "1" },
    });
    grad.createSvg("stop", { attr: { offset: "0%", "stop-color": "#b8bb26", "stop-opacity": "0.28" } });
    grad.createSvg("stop", { attr: { offset: "50%", "stop-color": "#fabd2f", "stop-opacity": "0.28" } });
    grad.createSvg("stop", { attr: { offset: "100%", "stop-color": "#fb4934", "stop-opacity": "0.28" } });

    svg.createSvg("rect", {
      attr: {
        x: `${margin.left}`,
        y: `${margin.top}`,
        width: `${width}`,
        height: `${plotH}`,
        fill: "url(#habsiadMoodGradient)",
        rx: "6",
      },
    });

    const minT = data[0].time;
    const maxT = data[data.length - 1].time;
    const span = Math.max(1, maxT - minT);
    const maxRank = Math.max(1, EMOTION_SCALE.length - 1);
    const x = (t: number) => margin.left + ((t - minT) / span) * width;
    const y = (rank: number) => margin.top + (rank / maxRank) * plotH;

    // Connecting line through every plotted emoji.
    const pointsAttr = data.map((d) => `${x(d.time)},${y(d.rank)}`).join(" ");
    svg.createSvg("polyline", {
      attr: {
        points: pointsAttr,
        fill: "none",
        stroke: "var(--text-muted, #ebdbb2)",
        "stroke-width": "1.5",
        "stroke-opacity": "0.6",
      },
    });

    // Decide which emojis to label, triaging per day when space is tight.
    const labels = wide ? data : this.triageLabels(data);
    for (const d of labels) {
      const text = svg.createSvg("text", {
        attr: {
          x: `${x(d.time)}`,
          y: `${y(d.rank)}`,
          "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": wide ? "16" : "14",
        },
        cls: "habsiad-mood-emoji",
      });
      text.textContent = d.emoji;
      const title = svg.createSvg("title");
      title.textContent = `${d.date} ${d.emoji}`;
    }

    // A handful of date ticks along the bottom.
    this.drawDateTicks(svg, data, x, margin.top + plotH + 14, cssWidth);
  }

  /**
   * When the graph is narrow, reduce clutter: per day keep the first, best,
   * worst and median emoji (the issue's "intelligently triage" requirement).
   */
  private triageLabels(data: MoodPoint[]): MoodPoint[] {
    const byDay = new Map<string, MoodPoint[]>();
    for (const d of data) {
      const arr = byDay.get(d.date);
      if (arr) arr.push(d);
      else byDay.set(d.date, [d]);
    }
    const seen = new Set<number>();
    const kept: MoodPoint[] = [];
    for (const group of byDay.values()) {
      group.sort((a, b) => a.time - b.time);
      let best = group[0];
      let worst = group[0];
      for (const d of group) {
        if (d.rank < best.rank) best = d;
        if (d.rank > worst.rank) worst = d;
      }
      const median = group[Math.floor(group.length / 2)];
      for (const d of [group[0], best, worst, median]) {
        if (!seen.has(d.time)) {
          seen.add(d.time);
          kept.push(d);
        }
      }
    }
    kept.sort((a, b) => a.time - b.time);
    return kept;
  }

  private drawDateTicks(
    svg: SVGElement,
    data: MoodPoint[],
    x: (t: number) => number,
    yPos: number,
    cssWidth: number
  ): void {
    const uniqueDates = Array.from(new Set(data.map((d) => d.date)));
    if (uniqueDates.length === 0) return;
    const maxTicks = Math.max(2, Math.min(8, Math.floor(cssWidth / 90)));
    const step = Math.max(1, Math.ceil(uniqueDates.length / maxTicks));
    const firstTimeByDate = new Map<string, number>();
    for (const d of data) {
      if (!firstTimeByDate.has(d.date)) firstTimeByDate.set(d.date, d.time);
    }
    for (let i = 0; i < uniqueDates.length; i += step) {
      const date = uniqueDates[i];
      const t = firstTimeByDate.get(date) as number;
      const label = svg.createSvg("text", {
        attr: {
          x: `${x(t)}`,
          y: `${yPos}`,
          "text-anchor": "middle",
          "font-size": "10",
          fill: "var(--text-faint, #928374)",
        },
      });
      label.textContent = date.slice(5); // MM-DD within the quarter
    }
  }

  // --- List view -----------------------------------------------------------

  private drawList(wrapper: HTMLElement): void {
    wrapper.empty();
    const days = this.windowDays();
    wrapper.createEl("h4", { text: "By date" });
    const table = wrapper.createEl("table", { cls: "habsiad-mood-table" });
    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", { text: "Date" });
    headerRow.createEl("th", { text: "Emojis (first → last)" });

    const tbody = table.createEl("tbody");
    for (const day of days) {
      const row = tbody.createEl("tr", { cls: "habsiad-clickable-row" });
      const dateCell = row.createEl("td");
      dateCell.createEl("span", {
        text: day.date,
        cls: "habsiad-date-link",
      });
      const emojiCell = row.createEl("td");
      emojiCell.createEl("span", {
        text: day.emojis.join(" "),
        cls: "habsiad-mood-emojis",
      });
      row.addEventListener("click", () => {
        this.app.workspace.openLinkText(day.file.path, "", true);
      });
    }
  }
}

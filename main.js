/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/commands/calorieCalculations.ts":
/*!*********************************************!*\
  !*** ./src/commands/calorieCalculations.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CalorieCalculations: () => (/* binding */ CalorieCalculations)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

/**
 * Calorie Calculations Handler
 * Handles parsing and calculating calorie totals from journal files
 */
class CalorieCalculations {
    constructor(plugin) {
        this.plugin = plugin;
    }
    /**
     * Calculates calorie totals by properly parsing the EST.CALORIES column in markdown tables
     * and updating the calories frontmatter key with the sum.
     */
    async calculateCalorieTotals() {
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Journal folder "${journalFolderName}" not found.`);
            return;
        }
        // Get all journal files with YYYY-MM-DD.md format
        const journalFiles = journalFolder.children
            .filter((file) => file instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/))
            .sort((a, b) => b.name.localeCompare(a.name)); // Sort by date descending
        let filesProcessed = 0;
        let filesUpdated = 0;
        // Debug printing function removed for production compliance
        for (const file of journalFiles) {
            filesProcessed++;
            const content = await this.plugin.app.vault.read(file);
            // Very specific approach: Look for a markdown table that has EST.CALORIES in the header
            // The crucial part is to properly parse the table structure with vertical bars
            // Start by looking at the content line by line, but preserve the exact format of each line
            const lines = content.split("\n");
            let foundCalorieTable = false;
            let calorieTableLines = [];
            let tableStartLine = 0;
            // First find a table with EST.CALORIES in the header
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Look for a header row that contains EST.CALORIES
                if (line.includes("EST.CALORIES") &&
                    line.startsWith("|") &&
                    line.endsWith("|")) {
                    foundCalorieTable = true;
                    tableStartLine = i;
                    break;
                }
            }
            if (!foundCalorieTable) {
                // No calorie table found in this file
                continue;
            }
            // Now extract the complete table
            let tableEndLine = tableStartLine;
            for (let i = tableStartLine; i < lines.length; i++) {
                const line = lines[i];
                if (line.startsWith("|") && line.endsWith("|")) {
                    calorieTableLines.push(line);
                    tableEndLine = i;
                }
                else if (i > tableStartLine) {
                    // We've reached the end of the table
                    break;
                }
            }
            // Make sure we have a header and at least one data row
            if (calorieTableLines.length < 3) {
                console.log(`Table too short in ${file.name}, found ${calorieTableLines.length} lines`);
                continue;
            }
            const tableText = calorieTableLines.join("\n");
            // Debug table printing removed for production compliance
            // Parse the header to find the column index for EST.CALORIES
            const headerLine = calorieTableLines[0];
            const headerCells = headerLine.split("|").map((cell) => cell.trim());
            // Find the index of the EST.CALORIES column (accounting for the empty cells at start/end)
            let estCaloriesColumnIndex = -1;
            for (let i = 0; i < headerCells.length; i++) {
                if (headerCells[i].toUpperCase() === "EST.CALORIES") {
                    estCaloriesColumnIndex = i;
                    break;
                }
            }
            if (estCaloriesColumnIndex === -1) {
                console.log(`Could not find EST.CALORIES column in header: ${headerLine}`);
                continue;
            }
            console.log(`EST.CALORIES column is at index ${estCaloriesColumnIndex} in ${file.name}`);
            // Now process each data row (skipping header and separator)
            let totalCalories = 0;
            for (let i = 2; i < calorieTableLines.length; i++) {
                const dataLine = calorieTableLines[i];
                const dataCells = dataLine.split("|");
                // Ensure the array has enough elements to access the EST.CALORIES column
                if (dataCells.length <= estCaloriesColumnIndex) {
                    console.log(`Row has insufficient columns: ${dataLine}`);
                    continue;
                }
                // Get the actual cell content at the EST.CALORIES position
                const calorieCell = dataCells[estCaloriesColumnIndex].trim();
                // Debug logging removed for production compliance
                // Skip empty cells or cells with just whitespace
                if (!calorieCell || calorieCell === "") {
                    continue;
                }
                // Try to extract a number from the cell
                // This regex looks for one or more digits, ignoring any surrounding text
                const numberMatch = calorieCell.match(/\d+/);
                if (numberMatch) {
                    const calories = parseInt(numberMatch[0], 10);
                    if (!isNaN(calories) && calories > 0) {
                        // Debug logging removed for production compliance
                        totalCalories += calories;
                    }
                }
            }
            if (totalCalories > 0) {
                // Debug logging removed for production compliance
                // Update the frontmatter with the calculated total
                await this.plugin.frontmatterCommands.updateCaloriesFrontmatter(file, totalCalories.toString());
                filesUpdated++;
            }
            else {
                console.log(`No valid calories found in ${file.name}`);
            }
        }
        if (filesUpdated > 0) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Updated calorie totals in ${filesUpdated} of ${filesProcessed} journal files.`);
        }
        else {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`No valid calorie data found. Checked ${filesProcessed} journal files.`);
        }
    }
}


/***/ }),

/***/ "./src/commands/frontmatterUpdates.ts":
/*!********************************************!*\
  !*** ./src/commands/frontmatterUpdates.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FrontmatterCommands: () => (/* binding */ FrontmatterCommands)
/* harmony export */ });
/**
 * Frontmatter Update Commands
 * Handles updating various frontmatter fields in journal entries
 */
class FrontmatterCommands {
    constructor(plugin) {
        this.plugin = plugin;
    }
    /**
     * Generic frontmatter field update utility
     * @param file - The file to update
     * @param fieldName - The frontmatter field name (e.g., 'steps', 'weight', 'calories')
     * @param newValue - The new value to set
     */
    async updateFrontmatterField(file, fieldName, newValue) {
        let content = await this.plugin.app.vault.read(file);
        // Locate frontmatter section
        const frontmatterRegex = /^---\\n([\\s\\S]*?)\\n---/;
        const match = content.match(frontmatterRegex);
        let newContent;
        if (match) {
            const frontmatterText = match[1];
            // Check if the field already exists
            const fieldRegex = new RegExp(`^${fieldName}:`, "m");
            const hasField = fieldRegex.test(frontmatterText);
            if (hasField) {
                // Modify the existing field value
                const updatedFrontmatter = frontmatterText
                    .split("\\n")
                    .map((line) => line.startsWith(`${fieldName}:`)
                    ? `${fieldName}: ${newValue}`
                    : line)
                    .join("\\n");
                newContent = content.replace(frontmatterRegex, `---\\n${updatedFrontmatter}\\n---`);
            }
            else {
                // Add the field to the existing frontmatter
                const updatedFrontmatter = frontmatterText + `\\n${fieldName}: ${newValue}`;
                newContent = content.replace(frontmatterRegex, `---\\n${updatedFrontmatter}\\n---`);
            }
        }
        else {
            // If no frontmatter exists, create it
            newContent = `---\\n${fieldName}: ${newValue}\\n---\\n\\n${content}`;
        }
        // Save the updated file
        await this.plugin.app.vault.modify(file, newContent);
    }
    /**
     * Updates the "steps" field in frontmatter
     */
    async updateStepsFrontmatter(file, newSteps) {
        await this.updateFrontmatterField(file, "steps", newSteps);
    }
    /**
     * Updates the "weight" field in frontmatter
     */
    async updateWeightFrontmatter(file, newWeight) {
        await this.updateFrontmatterField(file, "weight", newWeight);
    }
    /**
     * Updates the "calories" field in frontmatter
     */
    async updateCaloriesFrontmatter(file, newCalories) {
        await this.updateFrontmatterField(file, "calories", newCalories);
    }
    /**
     * Save custom frontmatter name-value pair
     */
    async saveCustomFrontmatterName(key, value) {
        if (!this.plugin.settings.customFrontmatter) {
            this.plugin.settings.customFrontmatter = {};
        }
        this.plugin.settings.customFrontmatter[key] = value;
        await this.plugin.settingsSync.saveSettings(this.plugin.settings);
    }
}


/***/ }),

/***/ "./src/commands/habiticaSync.ts":
/*!**************************************!*\
  !*** ./src/commands/habiticaSync.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HabiticaSyncCommand: () => (/* binding */ HabiticaSyncCommand)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

/**
 * Habitica Synchronization Command Handler
 * Handles generating and inserting Habitica habits and dailies into journal entries
 */
class HabiticaSyncCommand {
    constructor(plugin) {
        this.plugin = plugin;
    }
    /**
     * Main command to generate and insert habits and dailies
     * Validates the current context and delegates to insertion
     */
    async generateHabitsAndDailies() {
        const activeView = this.plugin.app.workspace.getActiveViewOfType(obsidian__WEBPACK_IMPORTED_MODULE_0__.MarkdownView);
        if (!activeView) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Please open a Markdown file to insert Habitica data.");
            return;
        }
        const file = activeView.file;
        if (!file) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No file is open. Please open a Markdown file.");
            return;
        }
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        if (!file.path.toLowerCase().startsWith(`${journalFolderName.toLowerCase()}/`)) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`This command can only be used in the ${journalFolderName} folder.`);
            return;
        }
        const fileNamePattern = /^\d{4}-\d{2}-\d{2}\.md$/;
        if (!fileNamePattern.test(file.name)) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("This command can only be used in daily journal notes.");
            return;
        }
        const { habiticaUserId, habiticaApiToken } = this.plugin.settings;
        if (!habiticaUserId || !habiticaApiToken) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Please enter your Habitica credentials in the Habsiad settings.");
            return;
        }
        await this.insertHabitsAndDailies(activeView);
    }
    /**
     * Fetches Habitica data and inserts formatted habits and dailies into the current note
     */
    async insertHabitsAndDailies(activeView) {
        var _a, _b;
        try {
            const tasks = await this.plugin.habiticaService.getTasks();
            const habitsOutput = tasks
                .filter((task) => task.type === "habit" &&
                (task.counterUp > 0 || task.counterDown > 0))
                .map((task) => `* Habit clicked: ${task.text} - Positive: ${task.counterUp}, Negative: ${task.counterDown}`)
                .join("\n");
            const dailiesOutput = tasks
                .filter((task) => task.type === "daily" && task.completed)
                .map((task) => `* ${task.text}`)
                .join("\n");
            // Use the date of the journal file being written into, not the current
            // system date. The filename is validated as YYYY-MM-DD.md upstream, so
            // its basename is the correct date even when editing past midnight or
            // backfilling an older day. (Fixes #17, #18)
            const journalDate = (_b = (_a = activeView.file) === null || _a === void 0 ? void 0 : _a.basename) !== null && _b !== void 0 ? _b : window.moment().format("YYYY-MM-DD");
            const output = `## Achievements on ${journalDate}\n${habitsOutput}\n\n## Completed Dailies\n${dailiesOutput}`;
            const editor = activeView.editor;
            editor.replaceRange(output, editor.getCursor());
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Habits and Dailies inserted successfully.");
        }
        catch (error) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to fetch Habitica tasks. Check console for details.");
            console.error("Error fetching Habitica tasks:", error);
        }
    }
}


/***/ }),

/***/ "./src/commands/utilityCommands.ts":
/*!*****************************************!*\
  !*** ./src/commands/utilityCommands.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   UtilityCommands: () => (/* binding */ UtilityCommands)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

/**
 * Utility Commands Handler
 * Handles text processing utilities and specialized sync operations
 */
class UtilityCommands {
    constructor(plugin) {
        this.plugin = plugin;
    }
    /**
     * Replace {WEEKDAY} placeholder with actual weekday name in journal files
     */
    async replaceWeekday(file) {
        var _a;
        // Get the active file if no specific file is passed
        if (!file) {
            const activeView = this.plugin.app.workspace.getActiveViewOfType(obsidian__WEBPACK_IMPORTED_MODULE_0__.MarkdownView);
            file = (_a = activeView === null || activeView === void 0 ? void 0 : activeView.file) !== null && _a !== void 0 ? _a : undefined;
        }
        // Ensure a valid TFile is provided
        if (!file) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Please open a journal entry.");
            return;
        }
        // Check if the file matches the expected yyyy-mm-dd.md pattern
        const fileName = file.name;
        const match = fileName.match(/^(\\d{4})-(\\d{2})-(\\d{2})\\.md$/);
        if (!match) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("This is not a valid journal file.");
            return;
        }
        const [_, year, month, day] = match;
        const date = new Date(`${year}-${month}-${day}`);
        const weekday = date
            .toLocaleDateString("en-US", { weekday: "long" })
            .toUpperCase();
        // Read the file's content
        let content = await this.plugin.app.vault.read(file);
        // Handle frontmatter: Find where it ends (after the second "---")
        const frontmatterEnd = content.indexOf("---", 3); // Find the second "---"
        const bodyStartIndex = frontmatterEnd !== -1 ? frontmatterEnd + 3 : 0; // Skip past "---\\n"
        const bodyContent = content.slice(bodyStartIndex);
        // Replace "# {WEEKDAY}" with the actual weekday
        const updatedBodyContent = bodyContent.replace(/^# \\{WEEKDAY\\}/m, `# ${weekday}`);
        // If no changes were made, notify the user and return
        if (bodyContent === updatedBodyContent) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No changes were made; # {WEEKDAY} not found.");
            return;
        }
        // Reassemble the content (frontmatter + updated body)
        const updatedContent = content.slice(0, bodyStartIndex) + updatedBodyContent;
        // Save the updated content back to the file
        await this.plugin.app.vault.modify(file, updatedContent);
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Updated {WEEKDAY} to ${weekday}`);
    }
    /**
     * Syncs the TODO section of the active journal file with Habitica tasks.
     * - It verifies the file is in YYYY-MM-DD.md format.
     * - It locates the "### TODO:" header and determines the block boundaries.
     */
    async syncTodo() {
        // Get the active file
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No active file found.");
            return;
        }
        // Check that the file name is in the format YYYY-MM-DD.md
        if (!/^\\d{4}-\\d{2}-\\d{2}\\.md$/.test(activeFile.name)) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("This command only works on journal files (YYYY-MM-DD.md).");
            return;
        }
        // Read the file content
        let content = await this.plugin.app.vault.read(activeFile);
        const lines = content.split("\\n");
        // Locate the TODO header; we expect a line exactly "### TODO:"
        let todoStart = -1;
        let todoEnd = lines.length;
        for (let i = 0; i < lines.length; i++) {
            if (/^### TODO:\\s*$/.test(lines[i])) {
                todoStart = i;
                // Look for the next markdown header (line starting with '#' and a space)
                for (let j = i + 1; j < lines.length; j++) {
                    if (/^#{1,6}\\s/.test(lines[j])) {
                        todoEnd = j;
                        break;
                    }
                }
                break;
            }
        }
        if (todoStart === -1) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No TODO header found in this file.");
            return;
        }
        // Extract the current TODO block (including header)
        const currentTodoBlock = lines.slice(todoStart, todoEnd).join("\\n");
        // Define the stock default block for comparison
        const defaultBlock = "### TODO:\\n- [ ] Task 1\\n- [ ] Task 2\\n- [ ] Task 3";
        // Fetch Habitica TODO tasks using the service
        let todos;
        try {
            todos = await this.plugin.habiticaService.getTodos();
        }
        catch (error) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to fetch Habitica TODOs. Check console for details.");
            console.error("Error fetching Habitica TODOs:", error);
            return;
        }
        if (todos.length === 0) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No incomplete TODOs found in Habitica.");
            return;
        }
        // Build a new TODO block from Habitica TODOs
        const newTodoBlock = ["### TODO:"]
            .concat(todos.map((todo) => `- [ ] ${todo.text}`))
            .join("\\n");
        // Check if the current block is the default; if so, replace unconditionally
        const isDefault = currentTodoBlock.trim() === defaultBlock.trim();
        // Check if there are any differences to the current block
        const isDifferent = currentTodoBlock.trim() !== newTodoBlock.trim();
        if (!isDefault && !isDifferent) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("TODO section is already up to date.");
            return;
        }
        // If it's not the default and it's different, ask for confirmation
        if (!isDefault && isDifferent) {
            const userWantsToReplace = confirm("The TODO section has custom content. Do you want to replace it with Habitica TODOs?");
            if (!userWantsToReplace) {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("TODO sync cancelled.");
                return;
            }
        }
        // Replace the TODO block
        const newLines = [
            ...lines.slice(0, todoStart),
            ...newTodoBlock.split("\\n"),
            ...lines.slice(todoEnd),
        ];
        const newContent = newLines.join("\\n");
        // Save the updated file
        await this.plugin.app.vault.modify(activeFile, newContent);
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`TODO section updated with ${todos.length} Habitica tasks.`);
    }
    /**
     * Sync basic Habitica stats to frontmatter (simple version)
     * Updates frontmatter fields with current Habitica user data
     */
    async syncBasicHabiticaStats() {
        var _a, _b, _c, _d, _e;
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No active file found.");
            return;
        }
        try {
            // Fetch user data from Habitica
            const userData = await this.plugin.habiticaService.getUserData();
            if (!(userData === null || userData === void 0 ? void 0 : userData.stats)) {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to fetch Habitica user data.");
                return;
            }
            // Get current content
            let content = await this.plugin.app.vault.read(activeFile);
            // Update frontmatter with Habitica stats
            const frontmatterRegex = /^---\\n([\\s\\S]*?)\\n---/;
            const match = content.match(frontmatterRegex);
            const habiticaData = {
                habitica_hp: ((_a = userData.stats.hp) === null || _a === void 0 ? void 0 : _a.toFixed(1)) || "0",
                habitica_mp: ((_b = userData.stats.mp) === null || _b === void 0 ? void 0 : _b.toFixed(1)) || "0",
                habitica_exp: ((_c = userData.stats.exp) === null || _c === void 0 ? void 0 : _c.toFixed(0)) || "0",
                habitica_gold: ((_d = userData.stats.gp) === null || _d === void 0 ? void 0 : _d.toFixed(0)) || "0",
                habitica_level: ((_e = userData.stats.lvl) === null || _e === void 0 ? void 0 : _e.toString()) || "1",
            };
            let newContent;
            if (match) {
                // Update existing frontmatter
                let frontmatterText = match[1];
                // Update each field
                Object.entries(habiticaData).forEach(([key, value]) => {
                    const fieldRegex = new RegExp(`^${key}:.*$`, "m");
                    if (fieldRegex.test(frontmatterText)) {
                        frontmatterText = frontmatterText.replace(fieldRegex, `${key}: ${value}`);
                    }
                    else {
                        frontmatterText += `\\n${key}: ${value}`;
                    }
                });
                newContent = content.replace(frontmatterRegex, `---\\n${frontmatterText}\\n---`);
            }
            else {
                // Create new frontmatter
                const frontmatterLines = Object.entries(habiticaData)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join("\\n");
                newContent = `---\\n${frontmatterLines}\\n---\\n\\n${content}`;
            }
            await this.plugin.app.vault.modify(activeFile, newContent);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Habitica data synced to frontmatter successfully.");
        }
        catch (error) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to sync Habitica data. Check console for details.");
            console.error("Error syncing Habitica to frontmatter:", error);
        }
    }
}


/***/ }),

/***/ "./src/habitica/habiticaService.ts":
/*!*****************************************!*\
  !*** ./src/habitica/habiticaService.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HabiticaService: () => (/* binding */ HabiticaService)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _types_obsidian__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./types/obsidian */ "./src/habitica/types/obsidian.ts");


class HabiticaService {
    constructor(plugin) {
        this.apiUrl = "https://habitica.com/api/v3";
        this.lastRequestTime = 0;
        this.minRequestInterval = 30000; // 30 seconds as per API guidelines
        this.plugin = plugin;
    }
    async respectRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`Habitica rate limit: waiting ${waitTime}ms before next request`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();
    }
    getCommonHeaders() {
        const { habiticaUserId } = this.plugin.settings;
        return {
            "x-api-user": habiticaUserId,
            "x-api-key": this.plugin.settings.habiticaApiToken,
            "x-client": `${habiticaUserId}-Habsiad`,
        };
    }
    async getUserData() {
        var _a;
        const { habiticaUserId, habiticaApiToken } = this.plugin.settings;
        if (!habiticaUserId || !habiticaApiToken) {
            throw new Error("Habitica credentials are not set.");
        }
        await this.respectRateLimit();
        const options = {
            url: `${this.apiUrl}/user`,
            method: "GET",
            headers: this.getCommonHeaders(),
        };
        try {
            const response = await (0,obsidian__WEBPACK_IMPORTED_MODULE_0__.requestUrl)(options);
            // Log rate limit info for debugging
            console.log("Habitica API Rate Limit Status:", {
                limit: response.headers["x-ratelimit-limit"],
                remaining: response.headers["x-ratelimit-remaining"],
                reset: response.headers["x-ratelimit-reset"],
            });
            return response.json.data;
        }
        catch (error) {
            console.error("Habitica API Error:", error);
            // Handle rate limiting specifically
            if (error.status === 429) {
                const retryAfter = (_a = error.headers) === null || _a === void 0 ? void 0 : _a["retry-after"];
                console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
                throw new _types_obsidian__WEBPACK_IMPORTED_MODULE_1__.HabsiadApiError(`Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`, error.status, "RATE_LIMIT");
            }
            throw error;
        }
    }
    async getTasks() {
        var _a;
        const { habiticaUserId, habiticaApiToken } = this.plugin.settings;
        if (!habiticaUserId || !habiticaApiToken) {
            throw new Error("Habitica credentials are not set.");
        }
        await this.respectRateLimit();
        const options = {
            url: `${this.apiUrl}/tasks/user`,
            method: "GET",
            headers: this.getCommonHeaders(),
        };
        try {
            const response = await (0,obsidian__WEBPACK_IMPORTED_MODULE_0__.requestUrl)(options);
            // Log rate limit info for debugging
            console.log("Habitica API Rate Limit Status:", {
                limit: response.headers["x-ratelimit-limit"],
                remaining: response.headers["x-ratelimit-remaining"],
                reset: response.headers["x-ratelimit-reset"],
            });
            return response.json.data;
        }
        catch (error) {
            console.error("Habitica API Error:", error);
            // Handle rate limiting specifically
            if (error.status === 429) {
                const retryAfter = (_a = error.headers) === null || _a === void 0 ? void 0 : _a["retry-after"];
                console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
                throw new _types_obsidian__WEBPACK_IMPORTED_MODULE_1__.HabsiadApiError(`Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`, error.status, "RATE_LIMIT");
            }
            throw error;
        }
    }
    async getTodos() {
        var _a;
        const { habiticaUserId, habiticaApiToken } = this.plugin.settings;
        if (!habiticaUserId || !habiticaApiToken) {
            throw new Error("Habitica credentials are not set.");
        }
        await this.respectRateLimit();
        const options = {
            url: `${this.apiUrl}/tasks/user?type=todos`,
            method: "GET",
            headers: this.getCommonHeaders(),
        };
        try {
            const response = await (0,obsidian__WEBPACK_IMPORTED_MODULE_0__.requestUrl)(options);
            // Log rate limit info for debugging
            console.log("Habitica API Rate Limit Status:", {
                limit: response.headers["x-ratelimit-limit"],
                remaining: response.headers["x-ratelimit-remaining"],
                reset: response.headers["x-ratelimit-reset"],
            });
            // Filter for incomplete TODO tasks
            const todos = response.json.data.filter((todo) => !todo.completed);
            return todos;
        }
        catch (error) {
            console.error("Habitica API Error:", error);
            // Handle rate limiting specifically
            if (error.status === 429) {
                const retryAfter = (_a = error.headers) === null || _a === void 0 ? void 0 : _a["retry-after"];
                console.error(`Rate limited. Retry after: ${retryAfter} seconds`);
                throw new _types_obsidian__WEBPACK_IMPORTED_MODULE_1__.HabsiadApiError(`Habitica API rate limit exceeded. Please wait ${retryAfter} seconds.`, error.status, "RATE_LIMIT");
            }
            throw error;
        }
    }
}


/***/ }),

/***/ "./src/habitica/types/obsidian.ts":
/*!****************************************!*\
  !*** ./src/habitica/types/obsidian.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   App: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.App),
/* harmony export */   Component: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.Component),
/* harmony export */   HabsiadApiError: () => (/* binding */ HabsiadApiError),
/* harmony export */   HabsiadPluginError: () => (/* binding */ HabsiadPluginError),
/* harmony export */   HabsiadSyncError: () => (/* binding */ HabsiadSyncError),
/* harmony export */   ItemView: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.ItemView),
/* harmony export */   Modal: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.Modal),
/* harmony export */   Plugin: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.Plugin),
/* harmony export */   PluginSettingTab: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.PluginSettingTab),
/* harmony export */   TFile: () => (/* reexport safe */ obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile),
/* harmony export */   isHabsiadApiError: () => (/* binding */ isHabsiadApiError),
/* harmony export */   isHabsiadPluginError: () => (/* binding */ isHabsiadPluginError),
/* harmony export */   isHabsiadSyncError: () => (/* binding */ isHabsiadSyncError)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);
/**
 * Obsidian-specific TypeScript interfaces and type extensions
 * Ensures proper integration with Obsidian API
 */

// Re-export commonly used Obsidian types for convenience

// Error types specific to our plugin
class HabsiadPluginError extends Error {
    constructor(message, code, category, originalError) {
        super(message);
        this.code = code;
        this.category = category;
        this.originalError = originalError;
        this.name = "HabsiadPluginError";
    }
}
class HabsiadApiError extends HabsiadPluginError {
    constructor(message, status, apiResponse, originalError) {
        super(message, `API_ERROR_${status}`, "api", originalError);
        this.status = status;
        this.apiResponse = apiResponse;
        this.name = "HabsiadApiError";
    }
}
class HabsiadSyncError extends HabsiadPluginError {
    constructor(message, syncType, affectedFiles, originalError) {
        super(message, `SYNC_ERROR_${syncType.toUpperCase()}`, "sync", originalError);
        this.syncType = syncType;
        this.affectedFiles = affectedFiles;
        this.name = "HabsiadSyncError";
    }
}
// Type guards for error checking
function isHabsiadPluginError(error) {
    return error instanceof HabsiadPluginError;
}
function isHabsiadApiError(error) {
    return error instanceof HabsiadApiError;
}
function isHabsiadSyncError(error) {
    return error instanceof HabsiadSyncError;
}


/***/ }),

/***/ "./src/modals/retroTagger.ts":
/*!***********************************!*\
  !*** ./src/modals/retroTagger.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RetroTaggerModal: () => (/* binding */ RetroTaggerModal)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

/**
 * RetroTagger Modal - Allows users to add achievements and dailies to journal entries
 * This modal provides an interface for retroactively tagging journal entries with
 * Habitica data for completed habits and dailies.
 */
class RetroTaggerModal extends obsidian__WEBPACK_IMPORTED_MODULE_0__.Modal {
    constructor(app, plugin) {
        super(app);
        this.selectedItems = {}; // key -> "achievement" or "daily"
        this.itemButtons = {};
        this.plugin = plugin;
        this.journalDate = "";
    }
    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        // Get current file to check if it's a journal entry
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            contentEl.createEl("div", { text: "No file is currently open." });
            return;
        }
        // Check if the file is in the journal folder and has the YYYY-MM-DD.md format
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const filePathLower = activeFile.path.toLowerCase();
        const journalFolderLower = journalFolderName.toLowerCase();
        if (!filePathLower.startsWith(`${journalFolderLower}/`)) {
            contentEl.createEl("div", {
                text: `This file is not in the ${journalFolderName} folder.`,
            });
            return;
        }
        const match = activeFile.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
        if (!match) {
            contentEl.createEl("div", {
                text: "This file is not a valid journal entry (YYYY-MM-DD.md format required).",
            });
            return;
        }
        this.journalDate = match[1];
        // Create the main container for the retrotagger UI
        const mainContainer = contentEl.createDiv({ cls: "retrotagger-container" });
        // Add header
        mainContainer.createEl("h2", { text: `RetroTagger - ${this.journalDate}` });
        // Add instructions
        const instructionsDiv = mainContainer.createDiv({
            cls: "retrotagger-instructions",
        });
        instructionsDiv.createEl("p", {
            text: "Items already in this journal entry are pre-selected and highlighted.",
        });
        instructionsDiv.createEl("p", {
            text: "Click once on an item to add it to Achievements (blue).",
        });
        instructionsDiv.createEl("p", {
            text: "Click twice on an item to add it to Dailies (green).",
        });
        instructionsDiv.createEl("p", { text: "Click a third time to deselect." });
        // Create container for Habitica items
        const itemsContainer = mainContainer.createDiv({
            cls: "retrotagger-items",
        });
        // Load the glossary to get Habitica keys
        const habiticaKeys = await this.loadHabiticaKeys();
        // Create buttons for each Habitica item
        for (const habiticaKey of habiticaKeys) {
            if (!habiticaKey)
                continue;
            const itemButton = itemsContainer.createEl("button", {
                text: habiticaKey,
                cls: "retrotagger-item",
            });
            this.itemButtons[habiticaKey] = itemButton;
            itemButton.addEventListener("click", () => {
                this.toggleItemSelection(habiticaKey);
            });
        }
        // Load existing achievements and dailies from the current file
        await this.loadExistingEntries(activeFile);
        // Create the "Preview" section to show what will be added
        const summaryContainer = mainContainer.createDiv({
            cls: "retrotagger-summary",
        });
        summaryContainer.createEl("h3", { text: "Preview" });
        const achievementsDiv = summaryContainer.createDiv({
            cls: "retrotagger-achievements",
        });
        achievementsDiv.createEl("h4", {
            text: `Achievements on ${this.journalDate}`,
            cls: "retrotagger-preview-header",
        });
        const achievementsList = achievementsDiv.createEl("ul", {
            cls: "retrotagger-achievements-list",
        });
        const dailiesDiv = summaryContainer.createDiv({
            cls: "retrotagger-dailies",
        });
        dailiesDiv.createEl("h4", {
            text: "Completed Dailies",
            cls: "retrotagger-preview-header",
        });
        const dailiesList = dailiesDiv.createEl("ul", {
            cls: "retrotagger-dailies-list",
        });
        // Update summary to show loaded existing entries
        this.updateSummary();
        // Add the "RetroTag" button
        const renderButton = mainContainer.createEl("button", {
            text: "RetroTag",
            cls: "retrotagger-render-button",
        });
        renderButton.addEventListener("click", async () => {
            await this.renderSelectedItems();
            this.close();
        });
        // Add "Cancel" button
        const cancelButton = mainContainer.createEl("button", {
            text: "Cancel",
            cls: "retrotagger-cancel-button",
        });
        cancelButton.addEventListener("click", () => {
            this.close();
        });
        // Add CSS for the RetroTagger UI
        this.addRetroTaggerStyles();
    }
    // Load Habitica keys from the glossary
    async loadHabiticaKeys() {
        const pluginFolder = `${this.plugin.app.vault.configDir}/plugins/Habsiad`;
        const glossaryFileName = "frontmatterGlossary.json";
        const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
        try {
            const data = await this.app.vault.adapter.read(glossaryPath);
            const glossaryMapping = JSON.parse(data);
            // Extract unique Habitica keys, handling both old and new format
            let habiticaKeys = [];
            for (const value of Object.values(glossaryMapping)) {
                if (typeof value === "string") {
                    // Old format: string values
                    if (value !== "")
                        habiticaKeys.push(value);
                }
                else if (typeof value === "object" && value !== null) {
                    // New format: object with habiticaKey property
                    const entry = value;
                    if (entry.habiticaKey &&
                        entry.habiticaKey !== "" &&
                        !entry.isDisabled) {
                        habiticaKeys.push(entry.habiticaKey);
                    }
                }
            }
            return habiticaKeys;
        }
        catch (error) {
            console.error("Error loading glossary:", error);
            return [];
        }
    }
    // Load existing achievements and dailies from the current file
    async loadExistingEntries(file) {
        try {
            const content = await this.app.vault.read(file);
            // Parse existing achievements
            const achievementsRegex = new RegExp(`## Achievements on ${this.journalDate}([\\s\\S]*?)(?=\\n##|$)`);
            const achievementsMatch = content.match(achievementsRegex);
            if (achievementsMatch) {
                const achievementsSection = achievementsMatch[1];
                // Look for lines like "* Habit clicked: HABIT_NAME - Positive: 1, Negative: 0"
                const habitLines = achievementsSection.match(/\* Habit clicked: ([^-]+)/g);
                if (habitLines) {
                    for (const line of habitLines) {
                        const habitMatch = line.match(/\* Habit clicked: ([^-]+)/);
                        if (habitMatch) {
                            const habitName = habitMatch[1].trim();
                            if (this.itemButtons[habitName]) {
                                this.selectedItems[habitName] = "achievement";
                                this.itemButtons[habitName].addClass("retrotagger-item-achievement");
                            }
                        }
                    }
                }
            }
            // Parse existing completed dailies
            const dailiesRegex = /## Completed Dailies([\s\S]*?)(?=\n##|$)/;
            const dailiesMatch = content.match(dailiesRegex);
            if (dailiesMatch) {
                const dailiesSection = dailiesMatch[1];
                // Look for lines like "* DAILY_NAME"
                const dailyLines = dailiesSection.match(/^\* (.+)$/gm);
                if (dailyLines) {
                    for (const line of dailyLines) {
                        const dailyMatch = line.match(/^\* (.+)$/);
                        if (dailyMatch) {
                            const dailyName = dailyMatch[1].trim();
                            // Skip habit lines that might be in the dailies section
                            if (!dailyName.startsWith("Habit clicked:") &&
                                this.itemButtons[dailyName]) {
                                this.selectedItems[dailyName] = "daily";
                                this.itemButtons[dailyName].addClass("retrotagger-item-daily");
                            }
                        }
                    }
                }
            }
            // Note: updateSummary() will be called after the summary container is created
        }
        catch (error) {
            console.error("Error loading existing entries:", error);
        }
    }
    // Toggle item selection between Achievement, Daily, and None
    toggleItemSelection(key) {
        const button = this.itemButtons[key];
        if (!this.selectedItems[key]) {
            // First click: Select as Achievement (blue)
            this.selectedItems[key] = "achievement";
            button.removeClass("retrotagger-item-daily");
            button.addClass("retrotagger-item-achievement");
        }
        else if (this.selectedItems[key] === "achievement") {
            // Second click: Change to Daily (green)
            this.selectedItems[key] = "daily";
            button.removeClass("retrotagger-item-achievement");
            button.addClass("retrotagger-item-daily");
        }
        else {
            // Third click: Deselect
            delete this.selectedItems[key];
            button.removeClass("retrotagger-item-achievement");
            button.removeClass("retrotagger-item-daily");
        }
        this.updateSummary();
    }
    // Update the summary section with selected items
    updateSummary() {
        const achievementsList = this.contentEl.querySelector(".retrotagger-achievements-list");
        const dailiesList = this.contentEl.querySelector(".retrotagger-dailies-list");
        if (achievementsList)
            achievementsList.empty();
        if (dailiesList)
            dailiesList.empty();
        for (const [key, type] of Object.entries(this.selectedItems)) {
            if (type === "achievement" && achievementsList) {
                achievementsList.createEl("li", { text: key });
            }
            else if (type === "daily" && dailiesList) {
                dailiesList.createEl("li", { text: key });
            }
        }
    }
    // Render the selected items to the journal entry
    async renderSelectedItems() {
        try {
            const activeFile = this.app.workspace.getActiveFile();
            if (!activeFile) {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No file is currently open.");
                return;
            }
            let content = await this.app.vault.read(activeFile);
            // Group items by type, separating new from existing
            const newAchievements = [];
            const newDailies = [];
            // Parse existing entries to avoid duplicates
            const existingAchievements = await this.getExistingAchievements(content);
            const existingDailies = await this.getExistingDailies(content);
            for (const [key, type] of Object.entries(this.selectedItems)) {
                if (type === "achievement" && !existingAchievements.includes(key)) {
                    newAchievements.push(key);
                }
                else if (type === "daily" && !existingDailies.includes(key)) {
                    newDailies.push(key);
                }
            }
            // Create the new sections
            let newContent = "";
            // Check if the file already has the Achievements section
            const achievementsRegex = new RegExp(`## Achievements on ${this.journalDate}`);
            const hasAchievementsSection = achievementsRegex.test(content);
            // Check if the file already has the Completed Dailies section
            const dailiesRegex = /## Completed Dailies/;
            const hasCompletedDailiesSection = dailiesRegex.test(content);
            if (newAchievements.length > 0) {
                if (hasAchievementsSection) {
                    // Append to existing Achievements section
                    const achievementsSectionRegex = new RegExp(`(## Achievements on ${this.journalDate}[\\s\\S]*?)(?=\\n##|$)`);
                    const match = content.match(achievementsSectionRegex);
                    if (match) {
                        const existingSection = match[1];
                        const newSection = existingSection +
                            "\n" +
                            newAchievements
                                .map((item) => `* Habit clicked: ${item} - Positive: 1, Negative: 0`)
                                .join("\n");
                        content = content.replace(existingSection, newSection);
                    }
                }
                else {
                    // Create new Achievements section
                    newContent += `\n## Achievements on ${this.journalDate}\n`;
                    newContent += newAchievements
                        .map((item) => `* Habit clicked: ${item} - Positive: 1, Negative: 0`)
                        .join("\n");
                }
            }
            if (newDailies.length > 0) {
                if (hasCompletedDailiesSection) {
                    // Append to existing Completed Dailies section
                    const dailiesSectionRegex = /## Completed Dailies[\s\S]*?(?=\n##|$)/;
                    const match = content.match(dailiesSectionRegex);
                    if (match) {
                        const existingSection = match[0];
                        const newSection = existingSection +
                            "\n" +
                            newDailies.map((item) => `* ${item}`).join("\n");
                        content = content.replace(existingSection, newSection);
                    }
                }
                else {
                    // Create new Completed Dailies section
                    if (!hasAchievementsSection || newAchievements.length === 0) {
                        newContent += "\n## Completed Dailies\n";
                    }
                    else {
                        newContent += "\n\n## Completed Dailies\n";
                    }
                    newContent += newDailies
                        .map((item) => `* ${item}`)
                        .join("\n");
                }
            }
            // Handle insertion of new sections
            if (newContent) {
                if (!hasAchievementsSection && !hasCompletedDailiesSection) {
                    // No existing sections, append at the end
                    content += newContent;
                }
                else if (!hasAchievementsSection && hasCompletedDailiesSection) {
                    // Insert new content (including Achievements section) before existing Completed Dailies
                    const dailiesRegex = /(## Completed Dailies)/;
                    content = content.replace(dailiesRegex, newContent + "\n$1");
                }
                else if (hasAchievementsSection && !hasCompletedDailiesSection) {
                    // Achievements exist but no Completed Dailies, append new Dailies section at the end
                    content += newContent;
                }
            }
            // Save the changes
            await this.app.vault.modify(activeFile, content);
            const totalItems = Object.keys(this.selectedItems).length;
            const newItemCount = newAchievements.length + newDailies.length;
            if (newItemCount > 0) {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Successfully updated journal entry for ${this.journalDate}. Added ${newItemCount} new items (${totalItems} total selected).`);
            }
            else {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Journal entry for ${this.journalDate} already contains all selected items.`);
            }
        }
        catch (error) {
            console.error("Error rendering selected items:", error);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Error updating journal entry. See console for details.");
        }
    }
    // Get existing achievements from content
    async getExistingAchievements(content) {
        const achievements = [];
        const achievementsRegex = new RegExp(`## Achievements on ${this.journalDate}([\\s\\S]*?)(?=\\n##|$)`);
        const achievementsMatch = content.match(achievementsRegex);
        if (achievementsMatch) {
            const achievementsSection = achievementsMatch[1];
            const habitLines = achievementsSection.match(/\* Habit clicked: ([^-]+)/g);
            if (habitLines) {
                for (const line of habitLines) {
                    const habitMatch = line.match(/\* Habit clicked: ([^-]+)/);
                    if (habitMatch) {
                        achievements.push(habitMatch[1].trim());
                    }
                }
            }
        }
        return achievements;
    }
    // Get existing dailies from content
    async getExistingDailies(content) {
        const dailies = [];
        const dailiesRegex = /## Completed Dailies([\s\S]*?)(?=\n##|$)/;
        const dailiesMatch = content.match(dailiesRegex);
        if (dailiesMatch) {
            const dailiesSection = dailiesMatch[1];
            const dailyLines = dailiesSection.match(/^\* (.+)$/gm);
            if (dailyLines) {
                for (const line of dailyLines) {
                    const dailyMatch = line.match(/^\* (.+)$/);
                    if (dailyMatch) {
                        const dailyName = dailyMatch[1].trim();
                        // Skip habit lines that might be in the dailies section
                        if (!dailyName.startsWith("Habit clicked:")) {
                            dailies.push(dailyName);
                        }
                    }
                }
            }
        }
        return dailies;
    }
    // Add CSS styles for the RetroTagger UI
    addRetroTaggerStyles() {
        const styles = document.createElement("style");
        styles.id = "retrotagger-styles";
        styles.textContent = `
      .retrotagger-container {
        padding: 16px;
      }
      
      .retrotagger-instructions {
        margin-bottom: 16px;
        padding: 8px;
        background-color: var(--background-secondary);
        border-radius: 4px;
      }
      
      .retrotagger-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }
      
      .retrotagger-item {
        padding: 8px 12px;
        border-radius: 4px;
        background-color: var(--background-secondary);
        border: none;
        cursor: pointer;
      }
      
      .retrotagger-item-achievement {
        background-color: #3498db;
        color: white;
      }
      
      .retrotagger-item-daily {
        background-color: #2ecc71;
        color: white;
      }
      
      .retrotagger-summary {
        margin-bottom: 16px;
        padding: 8px;
        background-color: var(--background-secondary);
        border-radius: 4px;
      }
      
      .retrotagger-preview-header {
        color: #fabd2f;
        margin-top: 12px;
        margin-bottom: 8px;
      }
      
      .retrotagger-render-button,
      .retrotagger-cancel-button {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        margin-right: 8px;
      }
      
      .retrotagger-render-button {
        background-color: var(--interactive-accent);
        color: var(--text-on-accent);
      }
      
      .retrotagger-cancel-button {
        background-color: var(--background-modifier-error);
        color: white;
      }
    `;
        document.head.appendChild(styles);
    }
    onClose() {
        // Clean up styles
        const styleEl = document.getElementById("retrotagger-styles");
        if (styleEl)
            styleEl.remove();
        const { contentEl } = this;
        contentEl.empty();
    }
}


/***/ }),

/***/ "./src/settings.ts":
/*!*************************!*\
  !*** ./src/settings.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEFAULT_SETTINGS: () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   HabsiadSettingTab: () => (/* binding */ HabsiadSettingTab)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

const DEFAULT_SETTINGS = {
    habiticaUserId: "",
    habiticaApiToken: "",
    journalFolderName: "Journal",
    customFrontmatter: {},
    shortcuts: {
        generateHabitsAndDailies: { modifiers: ["Mod", "Shift"], key: "H" },
        replaceWeekday: { modifiers: ["Mod", "Shift"], key: "D" },
        syncTodo: { modifiers: ["Mod", "Shift"], key: "Y" },
        syncHabiticaToFrontmatter: { modifiers: ["Mod", "Shift"], key: "Q" },
        calculateCalorieTotals: { modifiers: ["Mod", "Shift"], key: "C" },
        openRetrotagger: { modifiers: ["Mod", "Shift"], key: "'" },
    },
    // All tabs visible by default
    showTabs: {
        steps: true,
        weight: true,
        calories: true,
        alcohol: true,
    },
};
class HabsiadSettingTab extends obsidian__WEBPACK_IMPORTED_MODULE_0__.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl("h2", { text: "Habsiad Settings" });
        // Habitica User ID Setting
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Habitica User ID")
            .setDesc("Enter your Habitica User ID.")
            .addText((text) => text
            .setPlaceholder("User ID")
            .setValue(this.plugin.settings.habiticaUserId)
            .onChange(async (value) => {
            this.plugin.settings.habiticaUserId = value;
            await this.plugin.saveSettings();
        }));
        // Habitica API Token Setting
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Habitica API Token")
            .setDesc("Enter your Habitica API Token.")
            .addText((text) => text
            .setPlaceholder("API Token")
            .setValue(this.plugin.settings.habiticaApiToken)
            .onChange(async (value) => {
            this.plugin.settings.habiticaApiToken = value;
            await this.plugin.saveSettings();
        }));
        // Journal Folder Name Setting
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Journal Folder Name")
            .setDesc("Specify the folder where the plugin commands can be used.")
            .addText((text) => text
            .setPlaceholder("Journal")
            .setValue(this.plugin.settings.journalFolderName)
            .onChange(async (value) => {
            this.plugin.settings.journalFolderName = value;
            await this.plugin.saveSettings();
        }));
        // Add a section for keyboard shortcuts
        containerEl.createEl("h3", { text: "Keyboard Shortcuts" });
        // Helper function to create a shortcut setting
        const createShortcutSetting = (id, name, desc) => {
            const setting = new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl).setName(name).setDesc(desc);
            // Add dropdown for modifier keys
            setting.addDropdown((dropdown) => {
                const options = {
                    none: "None",
                    Mod: "Ctrl/Cmd",
                    "Mod+Shift": "Ctrl/Cmd+Shift",
                    "Mod+Alt": "Ctrl/Cmd+Alt",
                    Alt: "Alt",
                    "Alt+Shift": "Alt+Shift",
                };
                const currentModifiers = this.plugin.settings.shortcuts[id].modifiers;
                let currentValue = "none";
                if (currentModifiers.includes("Mod") &&
                    currentModifiers.includes("Shift")) {
                    currentValue = "Mod+Shift";
                }
                else if (currentModifiers.includes("Mod") &&
                    currentModifiers.includes("Alt")) {
                    currentValue = "Mod+Alt";
                }
                else if (currentModifiers.includes("Alt") &&
                    currentModifiers.includes("Shift")) {
                    currentValue = "Alt+Shift";
                }
                else if (currentModifiers.includes("Mod")) {
                    currentValue = "Mod";
                }
                else if (currentModifiers.includes("Alt")) {
                    currentValue = "Alt";
                }
                dropdown
                    .addOptions(options)
                    .setValue(currentValue)
                    .onChange(async (value) => {
                    let modifiers = [];
                    if (value === "Mod+Shift") {
                        modifiers = ["Mod", "Shift"];
                    }
                    else if (value === "Mod+Alt") {
                        modifiers = ["Mod", "Alt"];
                    }
                    else if (value === "Alt+Shift") {
                        modifiers = ["Alt", "Shift"];
                    }
                    else if (value !== "none" &&
                        (value === "Mod" || value === "Alt")) {
                        modifiers = [value];
                    }
                    this.plugin.settings.shortcuts[id].modifiers = modifiers;
                    await this.plugin.saveSettings();
                });
            });
            // Add text field for key
            setting.addText((text) => {
                text
                    .setPlaceholder("Key")
                    .setValue(this.plugin.settings.shortcuts[id].key)
                    .onChange(async (value) => {
                    if (value) {
                        this.plugin.settings.shortcuts[id].key = value.toUpperCase();
                        await this.plugin.saveSettings();
                    }
                });
            });
            return setting;
        };
        // Create settings for each shortcut
        createShortcutSetting("generateHabitsAndDailies", "Generate Habits & Dailies", "Shortcut to insert Habitica habits and dailies into the current note.");
        createShortcutSetting("replaceWeekday", "Replace {WEEKDAY}", "Shortcut to replace {WEEKDAY} with the actual day of the week.");
        createShortcutSetting("syncTodo", "Sync Habitica TODO", "Shortcut to sync Habitica TODOs to the current note.");
        createShortcutSetting("syncHabiticaToFrontmatter", "Sync Habitica to Frontmatter", "Shortcut to sync Habitica data to frontmatter in journal files.");
        createShortcutSetting("calculateCalorieTotals", "Calculate Calorie Totals", "Shortcut to calculate and update calorie totals in journal files.");
        createShortcutSetting("openRetrotagger", "Open Retrotagger", "Shortcut to open the Retrotagger tool for adding achievements and dailies to journal entries.");
        // Optional Tabs Section
        containerEl.createEl("h3", { text: "Optional Tabs" });
        containerEl.createEl("p", {
            text: "Choose which tabs to show in the sidebar. Changes will take effect after reloading the plugin.",
            cls: "setting-item-description",
        });
        // Steps Tab Toggle
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Show Steps Tab")
            .setDesc("Enable or disable the Steps tab in the sidebar.")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.showTabs.steps)
            .onChange(async (value) => {
            this.plugin.settings.showTabs.steps = value;
            await this.plugin.saveSettings();
        }));
        // Weight Tab Toggle
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Show Weight Tab")
            .setDesc("Enable or disable the Weight tab in the sidebar.")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.showTabs.weight)
            .onChange(async (value) => {
            this.plugin.settings.showTabs.weight = value;
            await this.plugin.saveSettings();
        }));
        // Calories Tab Toggle
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Show Calories Tab")
            .setDesc("Enable or disable the Calories tab in the sidebar.")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.showTabs.calories)
            .onChange(async (value) => {
            this.plugin.settings.showTabs.calories = value;
            await this.plugin.saveSettings();
        }));
        // Alcohol Tab Toggle
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Show Alcohol Tab")
            .setDesc("Enable or disable the Alcohol tab in the sidebar.")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.showTabs.alcohol)
            .onChange(async (value) => {
            this.plugin.settings.showTabs.alcohol = value;
            await this.plugin.saveSettings();
        }));
        // Settings Sync Section
        containerEl.createEl("h3", { text: "Settings Synchronization" });
        containerEl.createEl("p", {
            text: "Sync your settings across devices through your Obsidian vault. Settings are automatically backed up to a sync file when changed.",
            cls: "setting-item-description",
        });
        // Sync Status Display
        const syncStatusDiv = containerEl.createDiv({
            cls: "setting-item-description",
        });
        this.updateSyncStatus(syncStatusDiv);
        // Manual sync controls
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Export Settings to Sync File")
            .setDesc("Manually save current settings to sync file for cross-device synchronization.")
            .addButton((button) => button
            .setButtonText("Export Now")
            .setCta()
            .onClick(async () => {
            const success = await this.plugin.settingsSync.exportToSyncFile();
            if (success) {
                this.updateSyncStatus(syncStatusDiv);
            }
        }));
        new obsidian__WEBPACK_IMPORTED_MODULE_0__.Setting(containerEl)
            .setName("Import Settings from Sync File")
            .setDesc("Restore settings from sync file. This will overwrite current settings.")
            .addButton((button) => button
            .setButtonText("Import Now")
            .setWarning()
            .onClick(async () => {
            const success = await this.plugin.settingsSync.importFromSyncFile();
            if (success) {
                this.display(); // Refresh the settings display
            }
        }));
    }
    async updateSyncStatus(statusDiv) {
        statusDiv.empty();
        const settingsSync = this.plugin.settingsSync;
        const syncFileExists = await settingsSync.syncFileExists();
        if (syncFileExists) {
            statusDiv.createEl("span", {
                text: "✅ Sync file exists - settings will sync across devices",
                cls: "mod-success",
            });
        }
        else {
            statusDiv.createEl("span", {
                text: "⚠️ No sync file found - click 'Export Now' to create one",
                cls: "mod-warning",
            });
        }
    }
}


/***/ }),

/***/ "./src/utils/settingsSync.ts":
/*!***********************************!*\
  !*** ./src/utils/settingsSync.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SettingsSync: () => (/* binding */ SettingsSync)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

/**
 * Settings synchronization utility for cross-device sync
 * Stores settings in a file within the vault so they sync to mobile
 */
class SettingsSync {
    constructor(plugin) {
        this.plugin = plugin;
        this.syncFilePath = `${plugin.app.vault.configDir}/plugins/Habsiad/habsiad-settings.json`;
    }
    /**
     * Save settings to both Obsidian's data.json AND a sync file in the vault
     */
    async saveSettings(settings) {
        try {
            // Save to Obsidian's normal data.json
            await this.plugin.saveData(settings);
            // Also save to a sync file in the vault for cross-device sync
            await this.saveSyncFile(settings);
        }
        catch (error) {
            console.error("Error saving settings:", error);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to save settings");
        }
    }
    /**
     * Load settings with fallback priority:
     * 1. Obsidian's data.json (if exists)
     * 2. Sync file in vault (if data.json missing)
     * 3. Default settings (if neither exists)
     */
    async loadSettings() {
        try {
            // First try to load from Obsidian's normal data.json
            const localData = await this.plugin.loadData();
            if (localData && Object.keys(localData).length > 0) {
                // data.json exists and has content, use it
                console.log("Loaded settings from data.json");
                return localData;
            }
            // data.json is missing or empty, try to load from sync file
            const syncData = await this.loadSyncFile();
            if (syncData) {
                console.log("Loaded settings from sync file (data.json was missing)");
                // Save to data.json for future use
                await this.plugin.saveData(syncData);
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Settings restored from vault sync file");
                return syncData;
            }
            // Neither file exists, return defaults
            console.log("No settings found, using defaults");
            return {}; // Will be merged with defaults in main.ts
        }
        catch (error) {
            console.error("Error loading settings:", error);
            return {};
        }
    }
    /**
     * Save settings to sync file in vault
     */
    async saveSyncFile(settings) {
        try {
            // Create a clean copy without sensitive data for sync
            const syncSettings = this.sanitizeForSync(settings);
            const jsonContent = JSON.stringify(syncSettings, null, 2);
            await this.plugin.app.vault.adapter.write(this.syncFilePath, jsonContent);
        }
        catch (error) {
            console.warn("Could not save sync file:", error);
            // Don't throw - this is a nice-to-have feature
        }
    }
    /**
     * Load settings from sync file in vault
     */
    async loadSyncFile() {
        try {
            const content = await this.plugin.app.vault.adapter.read(this.syncFilePath);
            return JSON.parse(content);
        }
        catch (error) {
            console.warn("Could not load sync file:", error);
            return null;
        }
    }
    /**
     * Remove or mask sensitive data before syncing
     * You might want to exclude API tokens from syncing for security
     */
    sanitizeForSync(settings) {
        const syncSettings = { ...settings };
        // Option 1: Sync everything (including API keys)
        // This is convenient but less secure
        return syncSettings;
        // Option 2: Exclude sensitive data (uncomment if you prefer this)
        // syncSettings.habiticaApiToken = ""; // Don't sync API token
        // return syncSettings;
    }
    /**
     * Manual sync operation - import settings from sync file
     */
    async importFromSyncFile() {
        try {
            const syncData = await this.loadSyncFile();
            if (!syncData) {
                new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("No sync file found to import from");
                return false;
            }
            // Merge with current settings, prioritizing sync file
            this.plugin.settings = Object.assign({}, this.plugin.settings, syncData);
            await this.saveSettings(this.plugin.settings);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Settings imported from sync file");
            return true;
        }
        catch (error) {
            console.error("Error importing from sync file:", error);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to import settings from sync file");
            return false;
        }
    }
    /**
     * Manual sync operation - export current settings to sync file
     */
    async exportToSyncFile() {
        try {
            await this.saveSyncFile(this.plugin.settings);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Settings exported to sync file");
            return true;
        }
        catch (error) {
            console.error("Error exporting to sync file:", error);
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Failed to export settings to sync file");
            return false;
        }
    }
    /**
     * Check if sync file exists
     */
    async syncFileExists() {
        try {
            await this.plugin.app.vault.adapter.stat(this.syncFilePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}


/***/ }),

/***/ "./src/views/sidebarView.ts":
/*!**********************************!*\
  !*** ./src/views/sidebarView.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SidebarView: () => (/* binding */ SidebarView),
/* harmony export */   VIEW_TYPE_SIDEBAR: () => (/* binding */ VIEW_TYPE_SIDEBAR)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _tabs_frontmatterGlossary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./tabs/frontmatterGlossary */ "./src/views/tabs/frontmatterGlossary.ts");
/* harmony import */ var _tabs_dataQualityDiagnostics__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tabs/dataQualityDiagnostics */ "./src/views/tabs/dataQualityDiagnostics.ts");
/* harmony import */ var _tabs_alcoholTab__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./tabs/alcoholTab */ "./src/views/tabs/alcoholTab.ts");
/* harmony import */ var _tabs_labelsTab__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./tabs/labelsTab */ "./src/views/tabs/labelsTab.ts");
/* harmony import */ var _tabs_logsTab__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./tabs/logsTab */ "./src/views/tabs/logsTab.ts");






const VIEW_TYPE_SIDEBAR = "habsiad-sidebar-view";
class SidebarView extends obsidian__WEBPACK_IMPORTED_MODULE_0__.ItemView {
    constructor(leaf, plugin) {
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
                return this.plugin.settings.showTabs[tab.settingKey];
            }
            return true;
        });
        tabs.forEach((tab) => {
            const tabButton = tabContainer.createSpan("habsiad-tab habsiad-clickable");
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
        if (firstTab)
            firstTab.addClass("active");
        const contentArea = container.createDiv("habsiad-content-area");
        this.displayContent(contentArea, "info");
    }
    async onClose() {
        // Cleanup if necessary
    }
    switchTab(view) {
        const contentArea = this.containerEl.querySelector(".habsiad-content-area");
        if (contentArea) {
            contentArea.empty();
            this.displayContent(contentArea, view);
        }
    }
    displayContent(container, view) {
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
    async displayDiagnosticsTab(container) {
        const diagnosticsView = new _tabs_dataQualityDiagnostics__WEBPACK_IMPORTED_MODULE_2__.DataQualityDiagnosticsView(this.app, this.plugin);
        const diagnosticsElement = await diagnosticsView.render();
        container.appendChild(diagnosticsElement);
    }
    displayGlossaryTab(container) {
        (0,_tabs_frontmatterGlossary__WEBPACK_IMPORTED_MODULE_1__.displayGlossaryTable)(container, this.plugin);
    }
    displayStepsTab(container) {
        var _a;
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            container.setText(`Journal folder "${journalFolderName}" not found.`);
            return;
        }
        container.createEl("h3", { text: "Daily Steps" });
        const files = journalFolder.children.filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md");
        const dateFileMap = files
            .map((file) => {
            const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/); // Match YYYY-MM-DD.md
            if (!match)
                return null;
            const [_, year, month, day] = match;
            return { dateString: `${year}-${month}-${day}`, file };
        })
            .filter(Boolean);
        dateFileMap.sort((a, b) => {
            if (a.dateString < b.dateString)
                return -1;
            if (a.dateString > b.dateString)
                return 1;
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
            const frontmatter = metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter;
            const currentSteps = (_a = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.steps) !== null && _a !== void 0 ? _a : "";
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
    displayWeightTab(container) {
        var _a;
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            container.setText(`Journal folder "${journalFolderName}" not found.`);
            return;
        }
        container.createEl("h3", { text: "Daily Weight" });
        const files = journalFolder.children.filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md");
        const dateFileMap = files
            .map((file) => {
            const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/); // Match YYYY-MM-DD.md
            if (!match)
                return null;
            const [_, year, month, day] = match;
            return { dateString: `${year}-${month}-${day}`, file };
        })
            .filter(Boolean);
        dateFileMap.sort((a, b) => {
            if (a.dateString < b.dateString)
                return -1;
            if (a.dateString > b.dateString)
                return 1;
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
            const frontmatter = metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter;
            const currentWeight = (_a = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.weight) !== null && _a !== void 0 ? _a : "";
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
    displayCaloriesTab(container) {
        var _a;
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
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
        const files = journalFolder.children.filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md");
        const dateFileMap = files
            .map((file) => {
            const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/); // Match YYYY-MM-DD.md
            if (!match)
                return null;
            const [_, year, month, day] = match;
            return { dateString: `${year}-${month}-${day}`, file };
        })
            .filter(Boolean);
        dateFileMap.sort((a, b) => {
            if (a.dateString < b.dateString)
                return -1;
            if (a.dateString > b.dateString)
                return 1;
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
            const frontmatter = metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter;
            const currentCalories = (_a = frontmatter === null || frontmatter === void 0 ? void 0 : frontmatter.calories) !== null && _a !== void 0 ? _a : "";
            const row = tbody.createEl("tr");
            row.createEl("td", { text: dateString.replace(/-/g, "/") });
            const caloriesCell = row.createEl("td");
            const input = caloriesCell.createEl("input", { type: "number" });
            if (currentCalories) {
                input.value = currentCalories.toString();
            }
            input.addEventListener("change", async () => {
                const newCalories = input.value.trim();
                console.log("Updating calories for file:", file.name, "to:", newCalories);
                await this.plugin.updateCaloriesFrontmatter(file, newCalories);
            });
        }
    }
    async displayAlcoholTab(container) {
        const alcoholTab = new _tabs_alcoholTab__WEBPACK_IMPORTED_MODULE_3__.AlcoholTab(this.app, this.plugin);
        await alcoholTab.render(container);
    }
    async displayLabelsTab(container) {
        const labelsTab = new _tabs_labelsTab__WEBPACK_IMPORTED_MODULE_4__.LabelsTab(this.plugin, container);
        await labelsTab.render();
    }
    async displayLogsTab(container) {
        const logsTab = new _tabs_logsTab__WEBPACK_IMPORTED_MODULE_5__.LogsTab(this.plugin, container);
        await logsTab.render();
    }
    displayInfoTab(container) {
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
        const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
        clipPath.setAttribute("id", "h-cutout");
        const clipPathData = document.createElementNS("http://www.w3.org/2000/svg", "path");
        clipPathData.setAttribute("d", "M0,0 H180 V240 H0 Z M75,95 V145 H85 V125 H95 V145 H105 V95 H95 V115 H85 V95 Z");
        clipPath.appendChild(clipPathData);
        defs.appendChild(clipPath);
        // Background Layer & Vase silhouette
        const backgroundGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        backgroundGroup.setAttribute("fill", "#1c1c1c");
        const vasePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        vasePath.setAttribute("d", "M50,230 C0,200 0,100 50,60 L50,40 C50,10 70,10 90,10 C110,10 130,10 130,40 L130,60 C180,100 180,200 130,230 Z");
        backgroundGroup.appendChild(vasePath);
        // Orange-red decorative panel with the H carved out
        const decorativeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        decorativeGroup.setAttribute("clip-path", "url(#h-cutout)");
        const decorativePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        decorativePath.setAttribute("fill", "#D95737");
        decorativePath.setAttribute("d", "M50,215 C20,190 20,110 50,80 L130,80 C160,110 160,190 130,215 Z");
        decorativeGroup.appendChild(decorativePath);
        // Decorative Lines
        const linesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        linesGroup.setAttribute("fill", "none");
        linesGroup.setAttribute("stroke", "#1c1c1c");
        linesGroup.setAttribute("stroke-width", "4");
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", "50");
        line1.setAttribute("y1", "80");
        line1.setAttribute("x2", "130");
        line1.setAttribute("y2", "80");
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", "50");
        line2.setAttribute("y1", "215");
        line2.setAttribute("x2", "130");
        line2.setAttribute("y2", "215");
        linesGroup.appendChild(line1);
        linesGroup.appendChild(line2);
        // Handles
        const handlesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        handlesGroup.setAttribute("fill", "#1c1c1c");
        const handle1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        handle1.setAttribute("d", "M50,110 C25,110 25,150 50,150 L50,142 C35,142 35,118 50,118 Z");
        const handle2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        handle2.setAttribute("d", "M130,110 C155,110 155,150 130,150 L130,142 C145,142 145,118 130,118 Z");
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
            this.app.setting.open();
            this.app.setting.openTabById("habsiad");
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


/***/ }),

/***/ "./src/views/tabs/alcoholTab.ts":
/*!**************************************!*\
  !*** ./src/views/tabs/alcoholTab.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AlcoholTab: () => (/* binding */ AlcoholTab)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

class AlcoholTab {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    async render(container) {
        container.empty();
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            container.createEl("p", {
                text: `Journal folder "${journalFolderName}" not found.`,
                cls: "habsiad-error-message",
            });
            return;
        }
        container.createEl("h3", { text: "Alcohol Tracking" });
        const alcoholEntries = await this.scanForAlcoholEntries(journalFolder);
        if (alcoholEntries.length === 0) {
            container.createEl("p", {
                text: "No alcohol entries found in your journal.",
                cls: "habsiad-no-data",
            });
            return;
        }
        const table = container.createEl("table", { cls: "habsiad-alcohol-table" });
        const thead = table.createEl("thead");
        const headerRow = thead.createEl("tr");
        headerRow.createEl("th", { text: "Date" });
        headerRow.createEl("th", { text: "Alcohol Consumption" });
        const tbody = table.createEl("tbody");
        for (const entry of alcoholEntries) {
            const row = tbody.createEl("tr", { cls: "habsiad-clickable-row" });
            const dateCell = row.createEl("td");
            dateCell.createEl("span", {
                text: entry.dateString.replace(/-/g, "/"),
                cls: "habsiad-date-link",
            });
            const alcoholCell = row.createEl("td");
            alcoholCell.createEl("span", {
                text: entry.alcoholEmojis.join(" "),
                cls: "habsiad-alcohol-emojis",
            });
            // Make the row clickable
            row.addEventListener("click", () => {
                this.openJournalEntry(entry.file);
            });
        }
    }
    async scanForAlcoholEntries(journalFolder) {
        // List of alcohol-related emojis
        const alcoholEmojiList = [
            "🍺",
            "🍻",
            "🍷",
            "🍸",
            "🍹",
            "🥂",
            "🍾",
            "🥃",
            "🍶",
        ];
        const files = journalFolder.children.filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md");
        const alcoholEntries = [];
        for (const file of files) {
            const match = file.name.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
            if (!match)
                continue;
            const [_, year, month, day] = match;
            const dateString = `${year}-${month}-${day}`;
            try {
                const content = await this.app.vault.read(file);
                const foundEmojis = this.extractAlcoholEmojis(content, alcoholEmojiList);
                if (foundEmojis.length > 0) {
                    alcoholEntries.push({
                        dateString,
                        file,
                        alcoholEmojis: foundEmojis,
                    });
                }
            }
            catch (error) {
                console.error(`Error reading file ${file.name}:`, error);
            }
        }
        // Sort entries by date (newest first)
        alcoholEntries.sort((a, b) => {
            if (a.dateString > b.dateString)
                return -1;
            if (a.dateString < b.dateString)
                return 1;
            return 0;
        });
        return alcoholEntries;
    }
    extractAlcoholEmojis(content, alcoholEmojiList) {
        const foundEmojis = [];
        // Split content into lines for easier processing
        const lines = content.split("\n");
        let inReflectionsSection = false;
        let reflectionsContent = "";
        for (const line of lines) {
            // Check if we're starting a reflections section
            if (line.match(/^###+?\s*Reflections\s*:?\s*$/i)) {
                inReflectionsSection = true;
                continue;
            }
            // Check if we're hitting another section (stop collecting)
            if (inReflectionsSection && line.match(/^###+?\s*\w+/)) {
                break;
            }
            // Collect content if we're in reflections section
            if (inReflectionsSection) {
                reflectionsContent += line + "\n";
            }
        }
        // If we found reflections content, extract emojis
        if (reflectionsContent.trim()) {
            console.log("Found reflections content:", reflectionsContent);
            // Find all alcohol emojis in the order they appear in the text
            const allMatches = [];
            for (const emoji of alcoholEmojiList) {
                const regex = new RegExp(emoji, "g");
                let match;
                while ((match = regex.exec(reflectionsContent)) !== null) {
                    allMatches.push({
                        emoji: emoji,
                        index: match.index,
                    });
                }
            }
            // Sort by index to maintain the order they appear in the text
            allMatches.sort((a, b) => a.index - b.index);
            // Extract just the emojis in order
            foundEmojis.push(...allMatches.map((match) => match.emoji));
            console.log("Found alcohol emojis:", foundEmojis);
        }
        return foundEmojis;
    }
    async openJournalEntry(file) {
        const leaf = this.app.workspace.getUnpinnedLeaf();
        await leaf.openFile(file);
    }
}


/***/ }),

/***/ "./src/views/tabs/dataQualityDiagnostics.ts":
/*!**************************************************!*\
  !*** ./src/views/tabs/dataQualityDiagnostics.ts ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DataQualityDiagnosticsView: () => (/* binding */ DataQualityDiagnosticsView)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

class DataQualityDiagnosticsView {
    constructor(app, plugin) {
        this.app = app;
        this.plugin = plugin;
    }
    async render() {
        const container = document.createElement("div");
        container.classList.add("data-quality-diagnostics");
        const table = document.createElement("table");
        table.classList.add("habsiad-diagnostics-table");
        table.setAttr("style", "margin: 10px 0;");
        // Table header with 8 columns: DATE, ⭐, 🔨, 🛠️, 🥗, 📗, 📘, 📙
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        [
            "DATE",
            "⭐",
            "🔨",
            "🛠️",
            "🥗",
            "📗",
            "📘",
            "📙", // Achievements & Dailies
        ].forEach((text) => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });
        const tbody = table.createTBody();
        const journalFolder = this.getJournalFolder();
        if (!journalFolder) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 8; // Span across all 8 columns
            cell.textContent =
                "Journal folder not found. Please check your settings.";
        }
        else {
            const files = this.getJournalFiles(journalFolder);
            if (files.length === 0) {
                const row = tbody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 8; // Span across all 8 columns
                cell.textContent = "No journal files found in the specified folder.";
            }
            else {
                await this.processJournalFiles(files, tbody);
            }
        }
        container.appendChild(table);
        return container;
    }
    async processJournalFiles(files, tbody) {
        for (const file of files) {
            if (!(file instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile))
                continue;
            const row = tbody.insertRow();
            const fileContent = await this.app.vault.read(file);
            // Column A: Date
            const dateCell = row.insertCell();
            const dateLink = document.createElement("a");
            dateLink.textContent = file.basename.replace(".md", "");
            dateLink.href = "#";
            dateLink.classList.add("date-link", "habsiad-link");
            dateLink.onclick = (e) => {
                e.preventDefault();
                this.app.workspace.openLinkText(file.path, "", true);
            };
            dateCell.appendChild(dateLink);
            // Column B: Star (H5 headers)
            const h5Cell = row.insertCell();
            const h5Text = await this.extractH5Text(file);
            if (h5Text) {
                const starLink = document.createElement("a");
                starLink.textContent = "⭐";
                starLink.href = "#";
                starLink.title = h5Text;
                starLink.classList.add("star-link", "habsiad-link");
                starLink.onclick = (e) => {
                    e.preventDefault();
                    this.app.workspace.openLinkText(file.path, "", true);
                };
                h5Cell.appendChild(starLink);
            }
            // Column C: Work Status
            const workCell = row.insertCell();
            const hasWorkHeader = fileContent.includes("## WORK:");
            const firstHeaderMatch = fileContent.match(/^# (.+)$/m);
            const firstHeader = firstHeaderMatch
                ? firstHeaderMatch[1].trim().toUpperCase()
                : "";
            const isWeekend = firstHeader === "SATURDAY" || firstHeader === "SUNDAY";
            if (isWeekend && hasWorkHeader) {
                workCell.textContent = "❌";
                workCell.title = "Work logged on a weekend";
            }
            else if (hasWorkHeader) {
                workCell.textContent = "🔨";
                workCell.title = "Workday";
            }
            else if (h5Text) {
                workCell.textContent = "😃";
                workCell.title = "Vacation or holiday";
            }
            else {
                workCell.textContent = "😌";
                workCell.title = "Weekend";
            }
            // Column D: Work Summary & Completed Tasks
            const workSummaryCell = row.insertCell();
            if (!hasWorkHeader) {
                workSummaryCell.textContent = "😌";
                workSummaryCell.title = "No work logged";
            }
            else {
                const summaryMatch = fileContent.match(/###### Summary:\n([\s\S]*?)\n### Goals for Today:/);
                const summaryText = summaryMatch ? summaryMatch[1].trim() : "";
                const wordCount = summaryText ? summaryText.split(/\s+/).length : 0;
                let summaryIndicator = "❌";
                let summaryTooltip = "Incomplete Summary";
                if (wordCount > 60) {
                    summaryIndicator = "✅";
                    summaryTooltip = "Completed Summary";
                }
                else if (wordCount > 0) {
                    summaryIndicator = "❗";
                    summaryTooltip = "Insufficient Summary";
                }
                const goalsMatch = fileContent.match(/### Goals for Today:\n([\s\S]*?)\n## LIFE:/);
                const goalsText = goalsMatch ? goalsMatch[1].trim() : "";
                const completedTasks = (goalsText.match(/- \[x\]/g) || []).length;
                let goalsIndicator = "❌";
                let goalsTooltip = "No goals in place";
                if (completedTasks > 0) {
                    goalsIndicator = `<b>${completedTasks}</b>`;
                    goalsTooltip = `${completedTasks} completed tasks`;
                }
                // Use DOM API instead of innerHTML for security
                workSummaryCell.empty();
                if (summaryIndicator.includes("<b>")) {
                    const summaryBold = workSummaryCell.createEl("b");
                    summaryBold.textContent = summaryIndicator.replace(/<\/?b>/g, "");
                }
                else {
                    workSummaryCell.appendText(summaryIndicator);
                }
                workSummaryCell.appendText(", ");
                if (goalsIndicator.includes("<b>")) {
                    const goalsBold = workSummaryCell.createEl("b");
                    goalsBold.textContent = goalsIndicator.replace(/<\/?b>/g, "");
                }
                else {
                    workSummaryCell.appendText(goalsIndicator);
                }
                workSummaryCell.title = `${summaryTooltip}, ${goalsTooltip}`;
            }
            // Column E: Food Tracking
            const foodCell = row.insertCell();
            let mealCount = 0;
            let totalCalories = 0;
            const foodLines = fileContent.split("\n");
            const foodIndex = foodLines.findIndex((line) => /^#+\s*FOOD:$/i.test(line.trim()));
            if (foodIndex !== -1 && foodIndex + 3 < foodLines.length) {
                let currentLineIndex = foodIndex + 3;
                for (const mealType of ["Breakfast", "Lunch", "Dinner", "Snacks"]) {
                    if (currentLineIndex >= foodLines.length)
                        break;
                    const mealRow = foodLines[currentLineIndex];
                    if (!mealRow.includes("|")) {
                        currentLineIndex++;
                        continue;
                    }
                    let columns = mealRow.split("|").map((col) => col.trim());
                    if (columns[0] === "") {
                        columns.shift();
                    }
                    if (columns[columns.length - 1] === "") {
                        columns.pop();
                    }
                    if (columns.length >= 3 && columns[0] === mealType) {
                        if (columns[1].length > 0) {
                            mealCount++;
                        }
                        if (/^\d+$/.test(columns[2])) {
                            totalCalories += parseInt(columns[2], 10);
                        }
                    }
                    currentLineIndex++;
                }
            }
            const mealEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣"];
            const displayEmoji = mealEmojis[Math.min(mealCount, 4)];
            const emojiSpan = document.createElement("span");
            emojiSpan.textContent = displayEmoji;
            emojiSpan.classList.add("emoji-indicator", "habsiad-clickable");
            emojiSpan.title = `Total calories: ${totalCalories}`;
            foodCell.appendChild(emojiSpan);
            // Column F: TODO Section
            const fCell = row.insertCell();
            const todoMatch = fileContent.match(/### TODO:\s*([\s\S]*?)(?=\n###|$)/);
            const todoSection = todoMatch ? todoMatch[1].trim() : "";
            const todoLines = todoSection
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "");
            const templateTasks = ["- [ ] Task 1", "- [ ] Task 2", "- [ ] Task 3"];
            const isTemplate = todoLines.length === templateTasks.length &&
                templateTasks.every((task, i) => todoLines[i] === task);
            const isEmpty = todoLines.length === 0;
            if (isEmpty || isTemplate) {
                fCell.textContent = "❌";
                fCell.title = "No updates: Only template tasks or empty TODO section.";
            }
            else {
                const uncheckedTasks = todoLines.filter((line) => line.startsWith("- [ ]"));
                const journalDate = file.basename.replace(".md", "");
                const currentDate = new Date().toISOString().split("T")[0];
                if (journalDate !== currentDate && uncheckedTasks.length > 0) {
                    fCell.textContent = "❗";
                    fCell.title = "Warning: Incomplete tasks from a previous day.";
                }
                else {
                    const checkedTasks = todoLines.filter((line) => /^- \[[xX]\]/.test(line));
                    const count = checkedTasks.length;
                    // Use DOM API instead of innerHTML for security
                    fCell.empty();
                    const countBold = fCell.createEl("b");
                    countBold.textContent = count.toString();
                    fCell.title = `Amount of TODO-tasks cleared: ${count}`;
                }
            }
            // Column G: Reflections
            const gCell = row.insertCell();
            let reflectionsSection = "";
            const achievementsHeaderMatch = fileContent.match(/\n## Achievements/);
            if (achievementsHeaderMatch) {
                const reflectionsMatch = fileContent.match(/### Reflections:\s*([\s\S]*?)(?=\n## Achievements)/);
                reflectionsSection = reflectionsMatch ? reflectionsMatch[1].trim() : "";
            }
            else {
                const reflectionsStartMatch = fileContent.match(/### Reflections:\s*([\s\S]*)/);
                reflectionsSection = reflectionsStartMatch
                    ? reflectionsStartMatch[1].trim()
                    : "";
            }
            const reflectionLines = reflectionsSection
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line !== "");
            const bulletLines = reflectionLines.filter((line) => line.startsWith("- "));
            // Use regex to match a template bullet (allowing minor variations)
            const templatePattern = /- Thoughts or notes about personal life/i;
            if (bulletLines.length === 0 ||
                (bulletLines.length === 1 && templatePattern.test(bulletLines[0]))) {
                gCell.textContent = "❌";
                gCell.title = "no Reflections found";
            }
            else {
                // Use DOM API instead of innerHTML for security
                gCell.empty();
                const countBold = gCell.createEl("b");
                countBold.textContent = bulletLines.length.toString();
                gCell.title = `Amount of reflections: ${bulletLines.length}`;
            }
            // Column H: Achievements & Dailies
            const hColCell = row.insertCell();
            // Regexes to extract Achievements and Completed Dailies sections.
            const achievementsRegex = /## Achievements on\s+([0-9]{4}-[0-9]{2}-[0-9]{2})([\s\S]*?)(?=\n## Completed Dailies)/;
            const dailiesRegex = /## Completed Dailies\s*([\s\S]*)/;
            const achievementsMatch = fileContent.match(achievementsRegex);
            const dailiesMatch = fileContent.match(dailiesRegex);
            if (!achievementsMatch || !dailiesMatch) {
                hColCell.textContent = "❌";
                hColCell.title = "Achievements & Dailies not found";
            }
            else {
                const achievementsDate = achievementsMatch[1].trim();
                const fileDate = file.basename.replace(".md", "");
                if (achievementsDate !== fileDate) {
                    hColCell.textContent = "❗";
                    hColCell.title = "incorrect date set";
                }
                else {
                    // Count habit lines in the Achievements section.
                    const achievementsText = achievementsMatch[2];
                    const habitLines = achievementsText.match(/^\* Habit clicked:/gm) || [];
                    // Count daily lines in Completed Dailies (lines starting with "* " but not habit lines).
                    const dailiesText = dailiesMatch[1];
                    const dailyLines = dailiesText.match(/^\* (?!Habit clicked:)/gm) || [];
                    // Use DOM API instead of innerHTML for security
                    hColCell.empty();
                    const countBold = hColCell.createEl("b");
                    countBold.textContent = `${habitLines.length}, ${dailyLines.length}`;
                    hColCell.title = `Habits: ${habitLines.length}, Dailies: ${dailyLines.length}`;
                }
            }
        }
    }
    getJournalFolder() {
        const folderName = this.plugin.settings.journalFolderName || "Journal";
        const folder = this.app.vault.getAbstractFileByPath(folderName);
        return folder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder ? folder : null;
    }
    getJournalFiles(folder) {
        return folder.children
            .filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md")
            .map((f) => f)
            .sort((a, b) => a.basename.localeCompare(b.basename));
    }
    async extractH5Text(file) {
        const content = await this.app.vault.read(file);
        const match = content.match(/# .+?\n([\s\S]*?)\n## LIFE:/);
        if (!match)
            return null;
        const h5Lines = match[1]
            .split("\n")
            .filter((line) => line.startsWith("##### ") && !line.startsWith("######"))
            .map((line) => line.replace("##### ", "").trim());
        return h5Lines.length > 0 ? h5Lines.join(" ") : null;
    }
}


/***/ }),

/***/ "./src/views/tabs/frontmatterGlossary.ts":
/*!***********************************************!*\
  !*** ./src/views/tabs/frontmatterGlossary.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   displayGlossaryTable: () => (/* binding */ displayGlossaryTable),
/* harmony export */   getHabiticaKey: () => (/* binding */ getHabiticaKey),
/* harmony export */   isKeyDisabled: () => (/* binding */ isKeyDisabled),
/* harmony export */   saveHabiticaKey: () => (/* binding */ saveHabiticaKey),
/* harmony export */   setKeyDisabled: () => (/* binding */ setKeyDisabled)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

let glossaryMapping = {};
const glossaryFileName = "frontmatterGlossary.json";
/**
 * Loads the glossary mapping from frontmatterGlossary.json.
 * If the file doesn't exist, it creates an empty mapping and writes it.
 * Handles migration from old string-based format to new object format.
 */
async function loadGlossaryMapping(plugin) {
    const pluginFolder = `${plugin.app.vault.configDir}/plugins/Habsiad`;
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
                        habiticaKey: value,
                        isDisabled: false,
                    };
                }
                await saveGlossaryMapping(plugin); // Save in new format
            }
            else {
                // Already in new format
                glossaryMapping = parsedData;
            }
        }
        else {
            glossaryMapping = {};
        }
        console.log("Loaded glossary mapping:", glossaryMapping);
    }
    catch (error) {
        console.warn("Glossary file not found or unreadable. Creating a new one.", error);
        glossaryMapping = {};
        await saveGlossaryMapping(plugin);
    }
}
/**
 * Saves the current glossary mapping to frontmatterGlossary.json with 4-space indentation.
 */
async function saveGlossaryMapping(plugin) {
    const pluginFolder = `${plugin.app.vault.configDir}/plugins/Habsiad`;
    const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
    const json = JSON.stringify(glossaryMapping, null, 4);
    await plugin.app.vault.adapter.write(glossaryPath, json);
    console.log("Saved glossary mapping:", glossaryMapping);
}
/**
 * Returns the Habitica key for a given frontmatter key.
 */
function getHabiticaKey(key) {
    var _a;
    return ((_a = glossaryMapping[key]) === null || _a === void 0 ? void 0 : _a.habiticaKey) || "";
}
/**
 * Returns whether a frontmatter key is marked as disabled (not gathered from Habitica).
 */
function isKeyDisabled(key) {
    var _a;
    return ((_a = glossaryMapping[key]) === null || _a === void 0 ? void 0 : _a.isDisabled) || false;
}
/**
 * Sets the disabled state for a frontmatter key.
 */
async function setKeyDisabled(plugin, key, disabled) {
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
async function saveHabiticaKey(plugin, key, value) {
    if (!glossaryMapping[key]) {
        glossaryMapping[key] = { habiticaKey: "", isDisabled: false };
    }
    glossaryMapping[key].habiticaKey = value;
    console.log(`Saving Habitica key for frontmatter key "${key}":`, value);
    await saveGlossaryMapping(plugin);
}
function getAllFrontmatterKeys(plugin) {
    const journalFolderName = plugin.settings.journalFolderName || "Journal";
    const journalFolder = plugin.app.vault.getAbstractFileByPath(journalFolderName);
    if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
        console.warn("Journal folder not found:", journalFolderName);
        return [];
    }
    const files = journalFolder.children.filter((f) => f instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && f.extension === "md");
    const currentYear = new Date().getFullYear();
    const journalFiles = files.filter((file) => file.name.startsWith(`${currentYear}-`));
    const frontmatterKeys = new Set();
    for (const file of journalFiles) {
        const metadata = plugin.app.metadataCache.getFileCache(file);
        if (metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter) {
            Object.keys(metadata.frontmatter).forEach((key) => frontmatterKeys.add(key));
        }
    }
    return [...frontmatterKeys];
}
/**
 * Displays the glossary table in the provided container element.
 * The left column is now labeled "Habitica Key" and is editable,
 * while the right column displays the corresponding frontmatter key.
 */
async function displayGlossaryTable(container, plugin) {
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
    }
    else {
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
                console.log(`User entered Habitica key for frontmatter key "${key}":`, userValue);
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
            }
            else {
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
                    }
                    else {
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


/***/ }),

/***/ "./src/views/tabs/labelsTab.ts":
/*!*************************************!*\
  !*** ./src/views/tabs/labelsTab.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LabelsTab: () => (/* binding */ LabelsTab)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

class LabelsTab {
    constructor(plugin, container) {
        this.currentView = "overview";
        this.selectedLabel = null;
        this.plugin = plugin;
        this.container = container;
    }
    async render() {
        this.container.empty();
        if (this.currentView === "overview") {
            await this.renderOverview();
        }
        else if (this.currentView === "detail" && this.selectedLabel) {
            this.renderDetailView(this.selectedLabel);
        }
    }
    async renderOverview() {
        // Create header
        const header = this.container.createDiv({ cls: "tab-header" });
        header.createEl("h3", { text: "🏷️ Labels" });
        // Create loading indicator
        const loadingDiv = this.container.createDiv({ cls: "loading-indicator" });
        loadingDiv.createEl("p", { text: "Scanning journal files for labels..." });
        try {
            // Scan for labels
            const labels = await this.scanForLabels();
            // Remove loading indicator
            loadingDiv.remove();
            if (labels.length === 0) {
                const noDataDiv = this.container.createDiv({ cls: "no-data" });
                noDataDiv.createEl("p", { text: "No labels found in journal files." });
                return;
            }
            // Create labels grid
            const labelsGrid = this.container.createDiv({ cls: "labels-grid" });
            // Sort labels by count (descending) and then alphabetically
            labels.sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return a.emoji.localeCompare(b.emoji);
            });
            // Create buttons for each label
            for (const label of labels) {
                const labelButton = labelsGrid.createEl("button", {
                    cls: "label-button",
                    title: `${label.emoji} - Found ${label.count} time(s)`,
                });
                // Add emoji and count
                const emojiSpan = labelButton.createSpan({ cls: "label-emoji" });
                emojiSpan.textContent = label.emoji;
                const countSpan = labelButton.createSpan({ cls: "label-count" });
                countSpan.textContent = `(${label.count})`;
                // Click handler to show detailed view
                labelButton.addEventListener("click", () => {
                    this.selectedLabel = label;
                    this.currentView = "detail";
                    this.render();
                });
            }
            // Add summary
            const summaryDiv = this.container.createDiv({ cls: "labels-summary" });
            summaryDiv.createEl("p", {
                text: `Found ${labels.length} unique labels across all journal files.`,
                cls: "summary-text",
            });
        }
        catch (error) {
            loadingDiv.remove();
            console.error("Error scanning for labels:", error);
            const errorDiv = this.container.createDiv({ cls: "error-message" });
            errorDiv.createEl("p", {
                text: "Error scanning journal files. Check console for details.",
            });
        }
    }
    renderDetailView(label) {
        // Create header with back button
        const header = this.container.createDiv({ cls: "tab-header" });
        const titleContainer = header.createDiv({ cls: "detail-header" });
        const backButton = titleContainer.createEl("button", {
            text: "← Back",
            cls: "back-button",
        });
        backButton.addEventListener("click", () => {
            this.currentView = "overview";
            this.selectedLabel = null;
            this.render();
        });
        titleContainer.createEl("h3", { text: `${label.emoji} Label Details` });
        // Sort files chronologically (earliest first)
        const sortedFiles = [...label.files].sort((a, b) => a.date.localeCompare(b.date));
        // Create files list
        const filesContainer = this.container.createDiv({
            cls: "label-files-container",
        });
        filesContainer.createEl("h4", {
            text: `Found in ${sortedFiles.length} journal entries:`,
            cls: "files-header",
        });
        const filesList = filesContainer.createDiv({ cls: "files-list" });
        for (const file of sortedFiles) {
            const fileItem = filesList.createDiv({ cls: "file-item" });
            // Date link (clickable)
            const dateLink = fileItem.createEl("button", {
                text: file.date,
                cls: "date-link-button",
            });
            dateLink.addEventListener("click", async () => {
                // Open the file
                const fileToOpen = this.plugin.app.vault.getAbstractFileByPath(file.filePath);
                if (fileToOpen instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile) {
                    await this.plugin.app.workspace.getLeaf().openFile(fileToOpen);
                }
            });
            // Show occurrences in this file
            const occurrencesList = fileItem.createDiv({ cls: "occurrences-list" });
            for (const occurrence of file.occurrences) {
                const occurrenceSpan = occurrencesList.createSpan({
                    text: occurrence,
                    cls: "occurrence-item",
                });
            }
        }
        // Add summary
        const summaryDiv = this.container.createDiv({ cls: "labels-summary" });
        summaryDiv.createEl("p", {
            text: `Total occurrences: ${label.count} across ${sortedFiles.length} journal entries.`,
            cls: "summary-text",
        });
    }
    async scanForLabels() {
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        console.log(`Looking for journal folder: ${journalFolderName}`);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            throw new Error(`Journal folder "${journalFolderName}" not found.`);
        }
        // Get all journal files recursively with YYYY-MM-DD.md format
        const journalFiles = this.getJournalFilesRecursively(journalFolder);
        console.log(`Found ${journalFiles.length} journal files to scan (including subfolders):`, journalFiles.map((f) => f.path));
        const labelMap = new Map();
        // Pattern to match labels: `emoji: value`
        // Much more precise - emoji must be followed immediately by colon and space, then a short value
        const potentialLabelPattern = /`([^\s`]+):\s+([^`]{1,50})`/g;
        for (const file of journalFiles) {
            try {
                const content = await this.plugin.app.vault.read(file);
                // Look for Work Summary section
                const workSummaryMatch = content.match(/## Work Summary([\s\S]*?)(?=\n##|$)/);
                // Look for Reflections section (with or without colon)
                const reflectionsMatch = content.match(/## Reflections:?([\s\S]*?)(?=\n##|$)/);
                const sectionsToScan = [];
                if (workSummaryMatch) {
                    sectionsToScan.push(workSummaryMatch[1]);
                    console.log(`Found Work Summary in ${file.name}`);
                }
                if (reflectionsMatch) {
                    sectionsToScan.push(reflectionsMatch[1]);
                    console.log(`Found Reflections in ${file.name}`);
                }
                if (sectionsToScan.length === 0) {
                    console.log(`No relevant sections found in ${file.name}`);
                    // Let's also check what sections DO exist
                    const allHeaders = content.match(/^## .+$/gm);
                    console.log(`Headers found in ${file.name}:`, allHeaders);
                }
                // Scan each relevant section
                for (const section of sectionsToScan) {
                    let match;
                    while ((match = potentialLabelPattern.exec(section)) !== null) {
                        const emoji = match[1].trim();
                        const value = match[2].trim();
                        const fullMatch = match[0];
                        // Strict validation for proper labels
                        // 1. Emoji part must be a single emoji (no spaces, no long text)
                        // 2. Emoji part must contain actual emoji characters
                        // 3. Value part should be short (likely a number or brief text)
                        // Check if emoji part is a single token (no spaces or long text)
                        if (emoji.includes(" ") || emoji.length > 10) {
                            console.log(`Skipping multi-word or long emoji part: ${fullMatch} in ${file.name}`);
                            continue;
                        }
                        // Check if it contains actual emoji characters
                        const isEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]|[\u{238C}\u{2B06}\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u.test(emoji);
                        if (!isEmoji) {
                            console.log(`Skipping non-emoji label: ${fullMatch} in ${file.name}`);
                            continue;
                        }
                        // Check if value looks like a label value (short, not a sentence)
                        if (value.length > 50 || value.split(" ").length > 8) {
                            console.log(`Skipping long value that doesn't look like a label: ${fullMatch} in ${file.name}`);
                            continue;
                        }
                        // Additional check: if value contains certain words that indicate it's not a label
                        const nonLabelWords = [
                            "was",
                            "were",
                            "had",
                            "have",
                            "did",
                            "would",
                            "could",
                            "should",
                            "playing",
                            "watching",
                        ];
                        if (nonLabelWords.some((word) => value.toLowerCase().includes(word))) {
                            console.log(`Skipping narrative text that's not a label: ${fullMatch} in ${file.name}`);
                            continue;
                        }
                        console.log(`Found valid emoji label: ${fullMatch} in ${file.name}`);
                        // Process the validated emoji label
                        if (emoji) {
                            // Extract date from filename (YYYY-MM-DD)
                            const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
                            const date = dateMatch ? dateMatch[1] : file.name;
                            if (labelMap.has(emoji)) {
                                const existing = labelMap.get(emoji);
                                existing.count++;
                                // Store a few examples (limit to 5)
                                if (existing.examples.length < 5) {
                                    existing.examples.push(fullMatch);
                                }
                                // Check if we already have this file recorded
                                const existingFile = existing.files.find((f) => f.fileName === file.name);
                                if (existingFile) {
                                    existingFile.occurrences.push(fullMatch);
                                }
                                else {
                                    existing.files.push({
                                        fileName: file.name,
                                        date: date,
                                        filePath: file.path,
                                        occurrences: [fullMatch],
                                    });
                                }
                            }
                            else {
                                labelMap.set(emoji, {
                                    emoji,
                                    count: 1,
                                    examples: [fullMatch],
                                    files: [
                                        {
                                            fileName: file.name,
                                            date: date,
                                            filePath: file.path,
                                            occurrences: [fullMatch],
                                        },
                                    ],
                                });
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error reading file ${file.path}:`, error);
            }
        }
        return Array.from(labelMap.values());
    }
    getJournalFilesRecursively(folder) {
        const journalFiles = [];
        const processFolder = (currentFolder) => {
            for (const child of currentFolder.children) {
                if (child instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile) {
                    // Check if file matches journal format YYYY-MM-DD.md
                    if (child.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
                        journalFiles.push(child);
                    }
                }
                else if (child instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder) {
                    // Recursively process subfolders
                    processFolder(child);
                }
            }
        };
        processFolder(folder);
        return journalFiles;
    }
}


/***/ }),

/***/ "./src/views/tabs/logsTab.ts":
/*!***********************************!*\
  !*** ./src/views/tabs/logsTab.ts ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LogsTab: () => (/* binding */ LogsTab)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);

class LogsTab {
    constructor(plugin, container) {
        this.currentView = "overview";
        this.selectedLog = null;
        this.plugin = plugin;
        this.container = container;
    }
    async render() {
        this.container.empty();
        if (this.currentView === "overview") {
            await this.renderOverview();
        }
        else if (this.currentView === "detail" && this.selectedLog) {
            this.renderDetailView(this.selectedLog);
        }
    }
    async renderOverview() {
        // Create header
        const header = this.container.createDiv({ cls: "tab-header" });
        header.createEl("h3", { text: "📔 Logs" });
        // Create loading indicator
        const loadingDiv = this.container.createDiv({ cls: "loading-indicator" });
        loadingDiv.createEl("p", { text: "Scanning journal files for logs..." });
        try {
            // Scan for logs
            const logs = await this.scanForLogs();
            // Remove loading indicator
            loadingDiv.remove();
            if (logs.length === 0) {
                const noDataDiv = this.container.createDiv({ cls: "no-data" });
                noDataDiv.createEl("p", { text: "No logs found in journal files." });
                return;
            }
            // Create logs grid
            const logsGrid = this.container.createDiv({ cls: "logs-grid" });
            // Sort logs by count (descending) and then alphabetically
            logs.sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return a.type.localeCompare(b.type);
            });
            // Create buttons for each log type
            for (const log of logs) {
                const logButton = logsGrid.createEl("button", {
                    cls: "log-button",
                    title: `${log.type} - Found ${log.count} entries`,
                });
                // Add type name (in bold caps) and count
                const typeSpan = logButton.createSpan({ cls: "log-type" });
                typeSpan.textContent = log.type.toUpperCase();
                const countSpan = logButton.createSpan({ cls: "log-count" });
                countSpan.textContent = `(${log.count})`;
                // Click handler to show detailed view
                logButton.addEventListener("click", () => {
                    this.selectedLog = log;
                    this.currentView = "detail";
                    this.render();
                });
            }
            // Add summary
            const summaryDiv = this.container.createDiv({ cls: "logs-summary" });
            summaryDiv.createEl("p", {
                text: `Found ${logs.length} log types across all journal files.`,
                cls: "summary-text",
            });
        }
        catch (error) {
            loadingDiv.remove();
            console.error("Error scanning for logs:", error);
            const errorDiv = this.container.createDiv({ cls: "error-message" });
            errorDiv.createEl("p", {
                text: "Error scanning journal files. Check console for details.",
            });
        }
    }
    renderDetailView(log) {
        // Create header with back button
        const header = this.container.createDiv({ cls: "tab-header" });
        const titleContainer = header.createDiv({ cls: "detail-header" });
        const backButton = titleContainer.createEl("button", {
            text: "← Back",
            cls: "back-button",
        });
        backButton.addEventListener("click", () => {
            this.currentView = "overview";
            this.selectedLog = null;
            this.render();
        });
        titleContainer.createEl("h3", { text: `${log.type.toUpperCase()} Logs` });
        // Sort entries chronologically (earliest first)
        const sortedEntries = [...log.entries].sort((a, b) => a.date.localeCompare(b.date));
        // Create entries container
        const entriesContainer = this.container.createDiv({
            cls: "log-entries-container",
        });
        entriesContainer.createEl("h4", {
            text: `Found ${sortedEntries.length} entries:`,
            cls: "entries-header",
        });
        const entriesList = entriesContainer.createDiv({ cls: "entries-list" });
        for (const entry of sortedEntries) {
            const entryCard = entriesList.createDiv({ cls: "entry-card" });
            // Entry header with date and title
            const entryHeader = entryCard.createDiv({ cls: "entry-header" });
            const dateButton = entryHeader.createEl("button", {
                text: entry.date,
                cls: "entry-date-button",
            });
            dateButton.addEventListener("click", async () => {
                // Open the file
                const fileToOpen = this.plugin.app.vault.getAbstractFileByPath(entry.filePath);
                if (fileToOpen instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile) {
                    await this.plugin.app.workspace.getLeaf().openFile(fileToOpen);
                }
            });
            if (entry.title) {
                entryHeader.createEl("h5", {
                    text: entry.title,
                    cls: "entry-title",
                });
            }
            // Entry content
            const entryContent = entryCard.createDiv({ cls: "entry-content" });
            // Show image if available
            if (entry.hasImage && entry.imagePath) {
                const imageContainer = entryContent.createDiv({ cls: "entry-image" });
                let resolvedImagePath = entry.imagePath;
                // Handle different image path formats
                if (!resolvedImagePath.includes("/") &&
                    !resolvedImagePath.includes("\\")) {
                    // If it's just a filename, look in common attachment folders
                    const possiblePaths = [
                        entry.imagePath,
                        `attachments/${entry.imagePath}`,
                        `assets/${entry.imagePath}`,
                        `images/${entry.imagePath}`,
                        `_attachments/${entry.imagePath}`,
                    ];
                    for (const path of possiblePaths) {
                        const file = this.plugin.app.vault.getAbstractFileByPath(path);
                        if (file) {
                            resolvedImagePath = path;
                            break;
                        }
                    }
                }
                // Try to find the image file
                const imageFile = this.plugin.app.vault.getAbstractFileByPath(resolvedImagePath);
                if (imageFile) {
                    const img = imageContainer.createEl("img", {
                        cls: "log-entry-image",
                        attr: { alt: "Log image" },
                    });
                    // Use Obsidian's resource path resolver
                    const resourcePath = this.plugin.app.vault.adapter.getResourcePath(resolvedImagePath);
                    img.src = resourcePath;
                    // Add error handling for broken images
                    img.addEventListener("error", () => {
                        console.log(`Failed to load image: ${resolvedImagePath}`);
                        imageContainer.addClass("habsiad-hidden");
                    });
                    // Add success handling
                    img.addEventListener("load", () => {
                        console.log(`Successfully loaded image: ${resolvedImagePath}`);
                    });
                }
                else {
                    console.log(`Image file not found: ${resolvedImagePath}`);
                }
            }
            // Show content preview (first 200 characters)
            const contentPreview = entry.content.length > 200
                ? entry.content.substring(0, 200) + "..."
                : entry.content;
            entryContent.createEl("p", {
                text: contentPreview,
                cls: "entry-text",
            });
        }
        // Add summary
        const summaryDiv = this.container.createDiv({ cls: "logs-summary" });
        summaryDiv.createEl("p", {
            text: `Total ${log.type.toLowerCase()} entries: ${log.count}.`,
            cls: "summary-text",
        });
    }
    async scanForLogs() {
        const journalFolderName = this.plugin.settings.journalFolderName || "Journal";
        const journalFolder = this.plugin.app.vault.getAbstractFileByPath(journalFolderName);
        console.log(`Looking for journal folder: ${journalFolderName}`);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            throw new Error(`Journal folder "${journalFolderName}" not found.`);
        }
        // Get all journal files recursively with YYYY-MM-DD.md format
        const journalFiles = this.getJournalFilesRecursively(journalFolder);
        console.log(`Found ${journalFiles.length} journal files to scan (including subfolders):`, journalFiles.map((f) => f.path));
        const logMap = new Map();
        // Pattern to match Obsidian callouts: > [!TYPE] #### Title
        const calloutPattern = />\s*\[!([^\]]+)\]\s*(.*?)$/gm;
        for (const file of journalFiles) {
            try {
                const content = await this.plugin.app.vault.read(file);
                // Look for Reflections section (with or without colon)
                const reflectionsMatch = content.match(/## Reflections:?([\s\S]*?)(?=\n##|$)/);
                if (!reflectionsMatch) {
                    console.log(`No Reflections section found in ${file.name}`);
                    continue;
                }
                console.log(`Found Reflections in ${file.name}`);
                const reflectionsSection = reflectionsMatch[1];
                // Find all callout blocks in the reflections section
                let match;
                while ((match = calloutPattern.exec(reflectionsSection)) !== null) {
                    const logType = match[1].trim().toLowerCase();
                    const titleLine = match[2].trim();
                    console.log(`Found callout: [!${logType}] in ${file.name}`);
                    // Extract the full callout block
                    const calloutStart = match.index;
                    const fullCalloutMatch = this.extractFullCallout(reflectionsSection, calloutStart);
                    if (!fullCalloutMatch)
                        continue;
                    const { content: fullContent, hasImage, imagePath, } = fullCalloutMatch;
                    // Extract title from the title line (remove #### if present)
                    const title = titleLine.replace(/^#+\s*/, "");
                    // Extract date from filename (YYYY-MM-DD)
                    const dateMatch = file.name.match(/^(\d{4}-\d{2}-\d{2})/);
                    const date = dateMatch ? dateMatch[1] : file.name;
                    if (logMap.has(logType)) {
                        const existing = logMap.get(logType);
                        existing.count++;
                        existing.entries.push({
                            fileName: file.name,
                            date: date,
                            filePath: file.path,
                            title: title,
                            content: fullContent,
                            hasImage: hasImage,
                            imagePath: imagePath,
                        });
                    }
                    else {
                        logMap.set(logType, {
                            type: logType,
                            count: 1,
                            entries: [
                                {
                                    fileName: file.name,
                                    date: date,
                                    filePath: file.path,
                                    title: title,
                                    content: fullContent,
                                    hasImage: hasImage,
                                    imagePath: imagePath,
                                },
                            ],
                        });
                    }
                }
            }
            catch (error) {
                console.error(`Error reading file ${file.path}:`, error);
            }
        }
        return Array.from(logMap.values());
    }
    extractFullCallout(text, startIndex) {
        const lines = text.substring(startIndex).split("\n");
        const calloutLines = [];
        let hasImage = false;
        let imagePath;
        for (const line of lines) {
            if (line.startsWith(">")) {
                calloutLines.push(line.substring(1).trim());
                // Check for image references - both Obsidian [[]] and markdown ![]() formats
                const obsidianImageMatch = line.match(/!\[\[([^\]]+)\]\]/);
                const markdownImageMatch = line.match(/!\[.*?\]\(([^)]+)\)/);
                if (obsidianImageMatch) {
                    hasImage = true;
                    imagePath = obsidianImageMatch[1];
                }
                else if (markdownImageMatch) {
                    hasImage = true;
                    imagePath = markdownImageMatch[1];
                }
            }
            else if (line.trim() === "") {
                // Empty lines are part of the callout if we're inside one
                if (calloutLines.length > 0) {
                    calloutLines.push("");
                }
            }
            else {
                // Non-callout line, end of callout block
                break;
            }
        }
        if (calloutLines.length === 0)
            return null;
        const content = calloutLines.join("\n").trim();
        return { content, hasImage, imagePath };
    }
    getJournalFilesRecursively(folder) {
        const journalFiles = [];
        const processFolder = (currentFolder) => {
            for (const child of currentFolder.children) {
                if (child instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile) {
                    // Check if file matches journal format YYYY-MM-DD.md
                    if (child.name.match(/^\d{4}-\d{2}-\d{2}\.md$/)) {
                        journalFiles.push(child);
                    }
                }
                else if (child instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder) {
                    // Recursively process subfolders
                    processFolder(child);
                }
            }
        };
        processFolder(folder);
        return journalFiles;
    }
}


/***/ }),

/***/ "obsidian":
/*!***************************!*\
  !*** external "obsidian" ***!
  \***************************/
/***/ ((module) => {

module.exports = require("obsidian");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ HabsiadPlugin)
/* harmony export */ });
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! obsidian */ "obsidian");
/* harmony import */ var obsidian__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(obsidian__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _habitica_habiticaService__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./habitica/habiticaService */ "./src/habitica/habiticaService.ts");
/* harmony import */ var _views_sidebarView__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./views/sidebarView */ "./src/views/sidebarView.ts");
/* harmony import */ var _settings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./settings */ "./src/settings.ts");
/* harmony import */ var _utils_settingsSync__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/settingsSync */ "./src/utils/settingsSync.ts");
/* harmony import */ var _modals_retroTagger__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./modals/retroTagger */ "./src/modals/retroTagger.ts");
/* harmony import */ var _commands_habiticaSync__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./commands/habiticaSync */ "./src/commands/habiticaSync.ts");
/* harmony import */ var _commands_frontmatterUpdates__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./commands/frontmatterUpdates */ "./src/commands/frontmatterUpdates.ts");
/* harmony import */ var _commands_utilityCommands__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./commands/utilityCommands */ "./src/commands/utilityCommands.ts");
/* harmony import */ var _commands_calorieCalculations__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./commands/calorieCalculations */ "./src/commands/calorieCalculations.ts");










class HabsiadPlugin extends obsidian__WEBPACK_IMPORTED_MODULE_0__.Plugin {
    constructor() {
        super(...arguments);
        this.settings = _settings__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS; // ✅ Ensures initialization
    }
    async onload() {
        // Plugin loading is now handled by Obsidian's internal logging
        // Initialize settings sync
        this.settingsSync = new _utils_settingsSync__WEBPACK_IMPORTED_MODULE_4__.SettingsSync(this);
        // Load settings (with cross-device sync support)
        await this.loadSettings();
        // Initialize Habitica Service
        this.habiticaService = new _habitica_habiticaService__WEBPACK_IMPORTED_MODULE_1__.HabiticaService(this);
        // Initialize command handlers
        this.habiticaSyncCommand = new _commands_habiticaSync__WEBPACK_IMPORTED_MODULE_6__.HabiticaSyncCommand(this);
        this.frontmatterCommands = new _commands_frontmatterUpdates__WEBPACK_IMPORTED_MODULE_7__.FrontmatterCommands(this);
        this.utilityCommands = new _commands_utilityCommands__WEBPACK_IMPORTED_MODULE_8__.UtilityCommands(this);
        this.calorieCalculations = new _commands_calorieCalculations__WEBPACK_IMPORTED_MODULE_9__.CalorieCalculations(this);
        // Add settings tab
        this.addSettingTab(new _settings__WEBPACK_IMPORTED_MODULE_3__.HabsiadSettingTab(this.app, this));
        // Register the sidebar view
        this.registerView(_views_sidebarView__WEBPACK_IMPORTED_MODULE_2__.VIEW_TYPE_SIDEBAR, (leaf) => new _views_sidebarView__WEBPACK_IMPORTED_MODULE_2__.SidebarView(leaf, this));
        // Activate the sidebar view
        this.app.workspace.onLayoutReady(() => {
            this.activateSidebar();
        });
        // Register commands with customizable hotkeys
        this.addCommand({
            id: "generate-habits-and-dailies",
            name: "Generate Habits & Dailies",
            callback: () => this.habiticaSyncCommand.generateHabitsAndDailies(),
        });
        // Register the command to replace {WEEKDAY} with the correct day (Manual Trigger)
        this.addCommand({
            id: "replace-weekday",
            name: "Replace {WEEKDAY} with Actual Day",
            callback: () => this.utilityCommands.replaceWeekday(),
        });
        // Register the TODO-Sync command
        this.addCommand({
            id: "sync-todo",
            name: "Sync Habitica TODO",
            callback: () => this.utilityCommands.syncTodo(),
        });
        // Register the Habitica to Frontmatter sync command
        this.addCommand({
            id: "sync-habitica-to-frontmatter",
            name: "Sync Habitica to Frontmatter",
            callback: () => this.syncHabiticaToFrontmatter(),
        });
        // Register the Basic Habitica Stats sync command
        this.addCommand({
            id: "sync-basic-habitica-stats",
            name: "Sync Basic Habitica Stats",
            callback: () => this.utilityCommands.syncBasicHabiticaStats(),
        });
        // Register the Calculate Calorie Totals command
        this.addCommand({
            id: "calculate-calorie-totals",
            name: "Calculate Calorie Totals",
            callback: () => this.calorieCalculations.calculateCalorieTotals(),
        });
        // Register the Retrotagger command
        this.addCommand({
            id: "open-retrotagger",
            name: "Open Retrotagger",
            callback: () => this.openRetrotagger(),
        });
        // Register settings sync commands
        this.addCommand({
            id: "import-settings-from-sync",
            name: "Import Settings from Sync File",
            callback: () => this.settingsSync.importFromSyncFile(),
        });
        this.addCommand({
            id: "export-settings-to-sync",
            name: "Export Settings to Sync File",
            callback: () => this.settingsSync.exportToSyncFile(),
        });
        // Automatically replace {WEEKDAY} when a new file is created in the JOURNAL folder,
        // but only if the file contains the "# {WEEKDAY}" placeholder.
        this.registerEvent(this.app.vault.on("create", async (file) => {
            if (!(file instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile))
                return;
            const journalFolderName = this.settings.journalFolderName || "Journal";
            if (file.path.startsWith(`${journalFolderName}/`)) {
                // Read the file content to check for the placeholder
                const content = await this.app.vault.read(file);
                if (content.includes("# {WEEKDAY}")) {
                    this.utilityCommands.replaceWeekday(file);
                }
            }
        }));
    }
    onunload() {
        // Plugin unloading is now handled by Obsidian's internal logging
        // Note: Not detaching leaves as per Obsidian guidelines - leaves should persist
    }
    async activateSidebar() {
        if (this.app.workspace.getLeavesOfType(_views_sidebarView__WEBPACK_IMPORTED_MODULE_2__.VIEW_TYPE_SIDEBAR).length === 0) {
            const rightLeaf = this.app.workspace.getRightLeaf(true);
            if (rightLeaf) {
                await rightLeaf.setViewState({
                    type: _views_sidebarView__WEBPACK_IMPORTED_MODULE_2__.VIEW_TYPE_SIDEBAR,
                });
            }
            else {
                console.error("Failed to get or create the right leaf.");
            }
        }
    }
    async loadSettings() {
        const loadedSettings = await this.settingsSync.loadSettings();
        this.settings = Object.assign({}, _settings__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS, loadedSettings);
        // Migration: Ensure alcohol tab is enabled by default if it doesn't exist
        if (this.settings.showTabs &&
            this.settings.showTabs.alcohol === undefined) {
            this.settings.showTabs.alcohol = true;
            await this.saveSettings();
        }
    }
    async saveSettings() {
        await this.settingsSync.saveSettings(this.settings);
    }
    /**
     * Opens the RetroTagger modal for the current journal entry.
     * Allows users to retroactively add achievements and dailies to journal entries.
     */
    openRetrotagger() {
        const modal = new _modals_retroTagger__WEBPACK_IMPORTED_MODULE_5__.RetroTaggerModal(this.app, this);
        modal.open();
    }
    async saveCustomFrontmatterName(key, value) {
        await this.frontmatterCommands.saveCustomFrontmatterName(key, value);
    }
    getCustomFrontmatterName(key) {
        var _a;
        return ((_a = this.settings.customFrontmatter) === null || _a === void 0 ? void 0 : _a[key]) || "";
    }
    // Wrapper methods for frontmatter commands (for backward compatibility with views)
    async updateStepsFrontmatter(file, newSteps) {
        await this.frontmatterCommands.updateStepsFrontmatter(file, newSteps);
    }
    async updateWeightFrontmatter(file, newWeight) {
        await this.frontmatterCommands.updateWeightFrontmatter(file, newWeight);
    }
    async updateCaloriesFrontmatter(file, newCalories) {
        await this.frontmatterCommands.updateCaloriesFrontmatter(file, newCalories);
    }
    /**
     * Syncs Habitica data to frontmatter in all journal files.
     * - Scans all YYYY-MM-DD.md files in the journal folder
     * - Looks for "Achievements on {date}" and "Completed Dailies" headers
     * - Processes the bullet lists under those headers
     * - Updates the frontmatter with values from the Habitica data
     */
    async syncHabiticaToFrontmatter() {
        const journalFolderName = this.settings.journalFolderName || "Journal";
        const journalFolder = this.app.vault.getAbstractFileByPath(journalFolderName);
        if (!journalFolder || !(journalFolder instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFolder)) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Journal folder "${journalFolderName}" not found.`);
            return;
        }
        // Get the frontmatter glossary mapping
        const pluginFolder = `${this.app.vault.configDir}/plugins/Habsiad`;
        const glossaryFileName = "frontmatterGlossary.json";
        const glossaryPath = `${pluginFolder}/${glossaryFileName}`;
        let glossaryMapping = {};
        try {
            const data = await this.app.vault.adapter.read(glossaryPath);
            glossaryMapping = JSON.parse(data);
        }
        catch (error) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice("Could not read frontmatter glossary. Please set up glossary first.");
            console.error("Error reading glossary:", error);
            return;
        }
        // Create a reverse mapping (Habitica key -> frontmatter key)
        const reverseMapping = {};
        for (const [frontmatterKey, value] of Object.entries(glossaryMapping)) {
            let habiticaKey = "";
            if (typeof value === "string") {
                // Old format: string values
                habiticaKey = value;
            }
            else if (typeof value === "object" && value !== null) {
                // New format: object with habiticaKey property
                const entry = value;
                if (!entry.isDisabled) {
                    habiticaKey = entry.habiticaKey || "";
                }
            }
            if (habiticaKey) {
                reverseMapping[habiticaKey] = frontmatterKey;
            }
        }
        // Process all journal files
        const filteredFiles = journalFolder.children.filter((file) => file instanceof obsidian__WEBPACK_IMPORTED_MODULE_0__.TFile && file.name.match(/^\d{4}-\d{2}-\d{2}\.md$/));
        const journalFiles = filteredFiles.sort((a, b) => b.name.localeCompare(a.name)); // Sort by date descending
        let filesProcessed = 0;
        let filesUpdated = 0;
        for (const file of journalFiles) {
            filesProcessed++;
            const content = await this.app.vault.read(file);
            // Check if the file has the required headers
            const achievementsHeaderRegex = /^## Achievements on \d{4}-\d{2}-\d{2}/m;
            const dailiesHeaderRegex = /^## Completed Dailies/m;
            if (!achievementsHeaderRegex.test(content) &&
                !dailiesHeaderRegex.test(content)) {
                continue; // Skip this file if it doesn't have the required headers
            }
            // Extract the habit counter values and completed dailies from the content
            const habitCounters = {};
            const completedDailies = [];
            // Extract habit counters (e.g., "Habit clicked: Act of Love 💖 - Positive: 2, Negative: 0")
            const habitRegex = /\* Habit clicked: (.*?) - Positive: (\d+), Negative: (\d+)/g;
            let habitMatch;
            while ((habitMatch = habitRegex.exec(content)) !== null) {
                const habitName = habitMatch[1];
                const positiveCount = parseInt(habitMatch[2], 10) || 0;
                const negativeCount = parseInt(habitMatch[3], 10) || 0;
                const netCount = positiveCount - negativeCount;
                // Store the habit by its full name for matching purposes
                habitCounters[habitName] = netCount;
            }
            // Extract completed dailies (e.g., "* Daily Name")
            const dailiesSection = content.match(/## Completed Dailies\n([\s\S]*?)(?=\n##|$)/);
            if (dailiesSection && dailiesSection[1]) {
                const dailiesList = dailiesSection[1].trim().split("\n");
                dailiesList.forEach((daily) => {
                    if (daily.startsWith("* ")) {
                        completedDailies.push(daily.substring(2).trim());
                    }
                });
            }
            // Update frontmatter based on glossary mapping
            let frontmatterUpdates = {};
            // Process habits based on Habitica keys in glossary
            for (const [habitName, netCount] of Object.entries(habitCounters)) {
                // Look through all Habitica keys to find a match
                for (const [habiticaKey, frontmatterKey] of Object.entries(reverseMapping)) {
                    if (habitName.includes(habiticaKey)) {
                        frontmatterUpdates[frontmatterKey] = netCount;
                        break;
                    }
                }
            }
            // Process dailies based on Habitica keys in glossary
            for (const dailyName of completedDailies) {
                for (const [habiticaKey, frontmatterKey] of Object.entries(reverseMapping)) {
                    if (dailyName.includes(habiticaKey)) {
                        // For completed dailies, set the value to 1
                        frontmatterUpdates[frontmatterKey] = 1;
                        break;
                    }
                }
            }
            // If we have updates to make, update the frontmatter
            if (Object.keys(frontmatterUpdates).length > 0) {
                await this.updateFrontmatterValues(file, frontmatterUpdates);
                filesUpdated++;
            }
        }
        if (filesUpdated > 0) {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`Updated frontmatter in ${filesUpdated} of ${filesProcessed} journal files.`);
        }
        else {
            new obsidian__WEBPACK_IMPORTED_MODULE_0__.Notice(`No updates needed. Checked ${filesProcessed} journal files.`);
        }
    }
    /**
     * Updates multiple frontmatter values in a file.
     */
    async updateFrontmatterValues(file, updates) {
        let content = await this.app.vault.read(file);
        // Locate frontmatter section
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);
        let newContent;
        if (match) {
            let frontmatterText = match[1];
            const frontmatterLines = frontmatterText.split("\n");
            const updatedLines = [...frontmatterLines];
            // Track which keys we've updated
            const updatedKeys = new Set();
            // Update existing frontmatter lines
            for (let i = 0; i < frontmatterLines.length; i++) {
                const line = frontmatterLines[i];
                for (const [key, value] of Object.entries(updates)) {
                    if (line.startsWith(`${key}:`)) {
                        updatedLines[i] = `${key}: ${value}`;
                        updatedKeys.add(key);
                        break;
                    }
                }
            }
            // Add new frontmatter lines for keys not found
            for (const [key, value] of Object.entries(updates)) {
                if (!updatedKeys.has(key)) {
                    updatedLines.push(`${key}: ${value}`);
                }
            }
            // Replace the frontmatter block
            newContent = content.replace(frontmatterRegex, `---\n${updatedLines.join("\n")}\n---`);
        }
        else {
            // If no frontmatter exists, create it
            const frontmatterLines = Object.entries(updates).map(([key, value]) => `${key}: ${value}`);
            newContent = `---\n${frontmatterLines.join("\n")}\n---\n\n${content}`;
        }
        // Save the updated file
        await this.app.vault.modify(file, newContent);
    }
}

})();

var __webpack_export_target__ = exports;
for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ })()
;
//# sourceMappingURL=main.js.map
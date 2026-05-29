#!/usr/bin/env node

/**
 * Habsiad Refactoring Analysis Tool
 *
 * Analyzes the current codebase structure, complexity, and generates
 * detailed recommendations for the refactoring process.
 */

const fs = require("fs");
const path = require("path");

class RefactoringAnalyzer {
  constructor() {
    this.results = {
      files: {},
      metrics: {},
      recommendations: [],
      modularization: {},
      typeSystemAnalysis: {},
      apiUsagePatterns: [],
    };
    this.srcPath = path.join(__dirname, "src");
  }

  // Analyze file complexity and structure
  analyzeFile(filePath, content) {
    const lines = content.split("\n");
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      functions: this.countFunctions(content),
      classes: this.countClasses(content),
      imports: this.countImports(content),
      exports: this.countExports(content),
      complexity: this.calculateComplexity(content),
      dependencies: this.extractDependencies(content),
      todoComments: this.findTodoComments(content),
      apiCalls: this.findApiCalls(content),
      modalUsage: this.findModalUsage(content),
      eventHandlers: this.findEventHandlers(content),
    };
  }

  countFunctions(content) {
    const functionRegex =
      /(async\s+)?function\s+\w+|\w+\s*\([^)]*\)\s*[:{]|(async\s+)?\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/g;
    return (content.match(functionRegex) || []).length;
  }

  countClasses(content) {
    const classRegex = /class\s+\w+/g;
    return (content.match(classRegex) || []).length;
  }

  countImports(content) {
    const importRegex = /import\s+.*from\s+['"]/g;
    return (content.match(importRegex) || []).length;
  }

  countExports(content) {
    const exportRegex =
      /export\s+(default\s+)?(class|function|const|let|var|interface|type)/g;
    return (content.match(exportRegex) || []).length;
  }

  calculateComplexity(content) {
    // Simplified cyclomatic complexity
    const complexityKeywords =
      /\b(if|else|while|for|switch|case|catch|&&|\|\||\?)\b/g;
    const matches = content.match(complexityKeywords) || [];
    return matches.length + 1; // Base complexity is 1
  }

  extractDependencies(content) {
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    const dependencies = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  findTodoComments(content) {
    const todoRegex = /\/\/.*(?:TODO|FIXME|HACK|NOTE).*$/gm;
    return (content.match(todoRegex) || []).map((comment) => comment.trim());
  }

  findApiCalls(content) {
    const apiRegex = /(fetch|requestUrl|axios|request)\s*\(/g;
    return (content.match(apiRegex) || []).length;
  }

  findModalUsage(content) {
    const modalRegex = /(Modal|Dialog|contentEl)/g;
    return (content.match(modalRegex) || []).length;
  }

  findEventHandlers(content) {
    const eventRegex = /(addEventListener|onClick|onSubmit|callback)/g;
    return (content.match(eventRegex) || []).length;
  }

  // Analyze modularization opportunities
  analyzeModularization() {
    const mainFile = this.results.files["src/main.ts"];
    if (!mainFile) return;

    const recommendations = [];

    // Check for large files
    if (mainFile.totalLines > 500) {
      recommendations.push({
        type: "file_size",
        severity: "high",
        description: `main.ts is ${mainFile.totalLines} lines - should be split into modules`,
        suggestion: "Extract classes and large functions into separate files",
      });
    }

    // Check for multiple responsibilities
    if (mainFile.classes > 1) {
      recommendations.push({
        type: "single_responsibility",
        severity: "medium",
        description: `main.ts contains ${mainFile.classes} classes`,
        suggestion: "Extract secondary classes into separate modules",
      });
    }

    // Check for high complexity
    if (mainFile.complexity > 50) {
      recommendations.push({
        type: "complexity",
        severity: "high",
        description: `High cyclomatic complexity: ${mainFile.complexity}`,
        suggestion: "Break down complex functions and reduce nesting",
      });
    }

    this.results.modularization.recommendations = recommendations;
  }

  // Analyze type system usage
  analyzeTypeSystem() {
    const typeFiles = Object.keys(this.results.files).filter(
      (file) => file.includes("types") || file.endsWith(".d.ts")
    );

    const analysis = {
      typeFiles: typeFiles.length,
      totalTypes: 0,
      missingTypes: [],
      recommendations: [],
    };

    // Count any usage in type files
    typeFiles.forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      const interfaceCount = (content.match(/interface\s+\w+/g) || []).length;
      const typeCount = (content.match(/type\s+\w+/g) || []).length;
      analysis.totalTypes += interfaceCount + typeCount;
    });

    // Check for 'any' usage indicating missing types
    Object.keys(this.results.files).forEach((file) => {
      const fileData = this.results.files[file];
      if (fileData.content && fileData.content.includes(": any")) {
        analysis.missingTypes.push(file);
      }
    });

    if (analysis.totalTypes < 5) {
      analysis.recommendations.push({
        type: "type_coverage",
        severity: "medium",
        description: "Limited type definitions found",
        suggestion:
          "Create comprehensive type definitions for API responses and data structures",
      });
    }

    this.results.typeSystemAnalysis = analysis;
  }

  // Analyze API usage patterns
  analyzeApiUsage() {
    const patterns = [];

    Object.entries(this.results.files).forEach(([file, data]) => {
      if (data.apiCalls > 0) {
        patterns.push({
          file,
          apiCalls: data.apiCalls,
          dependencies: data.dependencies.filter(
            (dep) =>
              dep.includes("http") ||
              dep.includes("fetch") ||
              dep.includes("axios")
          ),
        });
      }
    });

    this.results.apiUsagePatterns = patterns;
  }

  // Generate modularization plan
  generateModularizationPlan() {
    const plan = {
      phase1: {
        name: "Extract Types",
        files: [
          "src/habitica/types/user.ts",
          "src/habitica/types/tasks.ts",
          "src/habitica/types/responses.ts",
        ],
        effort: "Low",
        description: "Create comprehensive type definitions",
      },
      phase2: {
        name: "Extract Modals",
        files: ["src/modals/retroTagger.ts", "src/modals/baseModal.ts"],
        effort: "Medium",
        description: "Move modal classes out of main.ts",
      },
      phase3: {
        name: "Extract Commands",
        files: [
          "src/commands/habitSync.ts",
          "src/commands/todoSync.ts",
          "src/commands/weekdayReplace.ts",
        ],
        effort: "Medium",
        description: "Split command handlers into separate modules",
      },
      phase4: {
        name: "Extract Utilities",
        files: [
          "src/utils/dateUtils.ts",
          "src/utils/errorHandler.ts",
          "src/utils/validation.ts",
        ],
        effort: "Low",
        description: "Move utility functions to dedicated modules",
      },
    };

    return plan;
  }

  // Main analysis runner
  async analyze() {
    console.log("🔍 Starting Habsiad Refactoring Analysis...\n");

    // Walk through source files
    this.walkDirectory(this.srcPath);

    // Run analyses
    this.analyzeModularization();
    this.analyzeTypeSystem();
    this.analyzeApiUsage();

    // Generate metrics
    this.calculateMetrics();

    // Generate report
    this.generateReport();
  }

  walkDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(__dirname, filePath);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.walkDirectory(filePath);
      } else if (file.endsWith(".ts") || file.endsWith(".js")) {
        const content = fs.readFileSync(filePath, "utf8");
        this.results.files[relativePath] = {
          ...this.analyzeFile(filePath, content),
          content: content,
        };
      }
    });
  }

  calculateMetrics() {
    const files = Object.values(this.results.files);

    this.results.metrics = {
      totalFiles: files.length,
      totalLines: files.reduce((sum, f) => sum + f.totalLines, 0),
      totalCodeLines: files.reduce((sum, f) => sum + f.codeLines, 0),
      averageComplexity:
        files.reduce((sum, f) => sum + f.complexity, 0) / files.length,
      totalFunctions: files.reduce((sum, f) => sum + f.functions, 0),
      totalClasses: files.reduce((sum, f) => sum + f.classes, 0),
      largestFile: Math.max(...files.map((f) => f.totalLines)),
      mostComplexFile: Math.max(...files.map((f) => f.complexity)),
    };
  }

  generateReport() {
    const report = `
# Habsiad Refactoring Analysis Report
Generated: ${new Date().toISOString()}

## 📊 Project Metrics
- **Total Files**: ${this.results.metrics.totalFiles}
- **Total Lines**: ${this.results.metrics.totalLines.toLocaleString()}
- **Code Lines**: ${this.results.metrics.totalCodeLines.toLocaleString()}
- **Average Complexity**: ${this.results.metrics.averageComplexity.toFixed(2)}
- **Total Functions**: ${this.results.metrics.totalFunctions}
- **Total Classes**: ${this.results.metrics.totalClasses}
- **Largest File**: ${this.results.metrics.largestFile} lines
- **Most Complex**: ${this.results.metrics.mostComplexFile} complexity

## 🏗️ File Analysis

${Object.entries(this.results.files)
  .map(
    ([file, data]) => `
### ${file}
- **Lines**: ${data.totalLines} (${data.codeLines} code)
- **Complexity**: ${data.complexity}
- **Functions**: ${data.functions}
- **Classes**: ${data.classes}
- **API Calls**: ${data.apiCalls}
- **Dependencies**: ${data.dependencies.length}
${
  data.todoComments.length > 0 ? `- **TODOs**: ${data.todoComments.length}` : ""
}
`
  )
  .join("")}

## 🔧 Modularization Recommendations

${
  this.results.modularization.recommendations
    ?.map(
      (rec) => `
### ${rec.type.toUpperCase()} - ${rec.severity.toUpperCase()}
**Issue**: ${rec.description}
**Solution**: ${rec.suggestion}
`
    )
    .join("") || "No specific recommendations generated."
}

## 📋 Type System Analysis
- **Type Files**: ${this.results.typeSystemAnalysis.typeFiles || 0}
- **Total Types**: ${this.results.typeSystemAnalysis.totalTypes || 0}
- **Files with 'any'**: ${
      this.results.typeSystemAnalysis.missingTypes?.length || 0
    }

${
  this.results.typeSystemAnalysis.recommendations
    ?.map(
      (rec) => `
**${rec.type}**: ${rec.description} - ${rec.suggestion}
`
    )
    .join("") || ""
}

## 🌐 API Usage Patterns
${
  this.results.apiUsagePatterns
    .map(
      (pattern) => `
- **${pattern.file}**: ${pattern.apiCalls} API calls
`
    )
    .join("") || "No API usage detected."
}

## 📅 Suggested Modularization Plan

${Object.entries(this.generateModularizationPlan())
  .map(
    ([phase, plan]) => `
### ${phase.toUpperCase()}: ${plan.name}
- **Effort**: ${plan.effort}
- **Description**: ${plan.description}
- **Files to Create**:
${plan.files.map((f) => `  - ${f}`).join("\n")}
`
  )
  .join("")}

## 🎯 Priority Actions

1. **Immediate** (High Impact, Low Effort):
   - Create type definitions in \`src/habitica/types/\`
   - Extract utility functions to \`src/utils/\`

2. **Short Term** (High Impact, Medium Effort):
   - Extract RetroTagger modal from main.ts
   - Split command handlers into separate files

3. **Medium Term** (Medium Impact, Medium Effort):
   - Implement comprehensive error handling
   - Add API response validation

4. **Long Term** (High Impact, High Effort):
   - Complete main.ts modularization
   - Implement comprehensive testing

## 🔍 Code Quality Insights

### Strengths Found:
- ✅ Good separation of views and settings
- ✅ Consistent naming conventions
- ✅ Active API integration

### Areas for Improvement:
- ⚠️  Large monolithic main.ts file
- ⚠️  Limited type definitions
- ⚠️  Mixed responsibilities in single files
- ⚠️  Manual error handling patterns

---
*This analysis provides a foundation for systematic refactoring while maintaining functionality.*
`;

    // Write report to file
    fs.writeFileSync("REFACTORING_ANALYSIS.md", report);

    console.log(
      "✅ Analysis complete! Report generated: REFACTORING_ANALYSIS.md"
    );
    console.log("\n📋 Quick Summary:");
    console.log(`- ${this.results.metrics.totalFiles} files analyzed`);
    console.log(
      `- ${this.results.metrics.totalLines.toLocaleString()} total lines`
    );
    console.log(`- Largest file: ${this.results.metrics.largestFile} lines`);
    console.log(
      `- Average complexity: ${this.results.metrics.averageComplexity.toFixed(
        2
      )}`
    );

    if (this.results.modularization.recommendations?.length > 0) {
      console.log(
        `- ${this.results.modularization.recommendations.length} refactoring recommendations`
      );
    }
  }
}

// Run the analysis
const analyzer = new RefactoringAnalyzer();
analyzer.analyze().catch(console.error);

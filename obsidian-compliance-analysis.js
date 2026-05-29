#!/usr/bin/env node

/**
 * Habsiad Obsidian Plugin Compliance & Refactoring Analysis Tool
 *
 * Analyzes the current codebase for both refactoring opportunities and
 * Obsidian plugin guidelines compliance based on official API patterns.
 */

const fs = require("fs");
const path = require("path");

class ObsidianComplianceAnalyzer {
  constructor() {
    this.results = {
      files: {},
      metrics: {},
      compliance: {
        apiUsage: [],
        bestPractices: [],
        typeCompliance: [],
        performanceIssues: [],
      },
      recommendations: [],
      obsidianPatterns: {},
    };
    this.srcPath = path.join(__dirname, "src");
  }

  // Analyze Obsidian API compliance patterns
  analyzeObsidianCompliance(content, filePath) {
    const compliance = {
      apiUsage: [],
      bestPractices: [],
      typeCompliance: [],
      performanceIssues: [],
    };

    // Check for proper Component lifecycle usage
    const componentExtends = content.match(
      /class\s+\w+\s+extends\s+(Component|Plugin|Modal|ItemView|SettingTab)/g
    );
    if (componentExtends) {
      compliance.bestPractices.push({
        type: "component_lifecycle",
        severity: "good",
        pattern: componentExtends.join(", "),
        description: "Properly extends Obsidian base classes",
      });
    }

    // Check for proper event registration patterns
    const eventRegistrations = content.match(
      /(registerEvent|registerDomEvent|registerInterval)/g
    );
    if (eventRegistrations) {
      compliance.bestPractices.push({
        type: "event_management",
        severity: "good",
        count: eventRegistrations.length,
        description: "Uses proper event registration for cleanup",
      });
    }

    // Check for direct DOM manipulation instead of Obsidian methods
    const directDOM = content.match(
      /document\.(createElement|querySelector|getElementById)/g
    );
    if (directDOM) {
      compliance.performanceIssues.push({
        type: "dom_manipulation",
        severity: "warning",
        count: directDOM.length,
        description:
          "Uses direct DOM manipulation instead of Obsidian createEl/find methods",
      });
    }

    // Check for proper type usage from Obsidian API
    const obsidianTypes = content.match(
      /:\s*(App|Plugin|Component|TFile|Vault|Workspace|MetadataCache)/g
    );
    if (obsidianTypes) {
      compliance.typeCompliance.push({
        type: "obsidian_types",
        severity: "good",
        count: obsidianTypes.length,
        description: "Uses proper Obsidian TypeScript types",
      });
    }

    // Check for deprecated patterns
    const deprecatedPatterns = [
      {
        pattern: /app\.vault\.read\(/g,
        issue: "Consider using app.vault.cachedRead for better performance",
      },
      {
        pattern: /new Notice\(/g,
        issue: "Verify notices are not excessive (user experience)",
      },
      {
        pattern: /setTimeout|setInterval/g,
        issue: "Should use registerInterval for proper cleanup",
      },
    ];

    deprecatedPatterns.forEach(({ pattern, issue }) => {
      const matches = content.match(pattern);
      if (matches) {
        compliance.performanceIssues.push({
          type: "potential_issue",
          severity: "warning",
          count: matches.length,
          description: issue,
        });
      }
    });

    // Check for proper error handling
    const errorHandling = content.match(/(try\s*\{|catch\s*\()/g);
    const apiCalls = content.match(
      /(requestUrl|fetch|app\.vault\.|app\.workspace\.)/g
    );
    if (
      apiCalls &&
      (!errorHandling || errorHandling.length < apiCalls.length / 2)
    ) {
      compliance.performanceIssues.push({
        type: "error_handling",
        severity: "high",
        description: "Insufficient error handling for API calls",
      });
    }

    // Check for proper settings handling
    const settingsPattern = content.match(/(loadData|saveData)/g);
    if (settingsPattern) {
      compliance.bestPractices.push({
        type: "settings_management",
        severity: "good",
        count: settingsPattern.length,
        description: "Uses proper Obsidian settings persistence",
      });
    }

    return compliance;
  }

  // Generate Obsidian-specific recommendations
  generateObsidianRecommendations(allCompliance) {
    const recommendations = [];

    // API Usage Recommendations
    const domIssues = allCompliance.filter((c) =>
      c.performanceIssues.some((p) => p.type === "dom_manipulation")
    );
    if (domIssues.length > 0) {
      recommendations.push({
        priority: "high",
        category: "API Compliance",
        title: "Replace Direct DOM Manipulation",
        description:
          "Use Obsidian's createEl, find, and DOM helper methods instead of direct document methods",
        example:
          'Use: containerEl.createEl("div") instead of document.createElement("div")',
      });
    }

    // Type Safety Recommendations
    const typeIssues = allCompliance.filter(
      (c) => c.typeCompliance.length === 0
    );
    if (typeIssues.length > 0) {
      recommendations.push({
        priority: "medium",
        category: "Type Safety",
        title: "Add Obsidian Type Annotations",
        description:
          "Import and use proper types from obsidian module for better IDE support and error catching",
        example: 'Import { App, Plugin, TFile } from "obsidian"',
      });
    }

    // Performance Recommendations
    const errorHandlingIssues = allCompliance.filter((c) =>
      c.performanceIssues.some((p) => p.type === "error_handling")
    );
    if (errorHandlingIssues.length > 0) {
      recommendations.push({
        priority: "high",
        category: "Error Handling",
        title: "Implement Comprehensive Error Handling",
        description:
          "All Obsidian API calls should have proper try-catch blocks with user-friendly error messages",
        example:
          "Wrap app.vault operations and show meaningful Notice messages on failure",
      });
    }

    return recommendations;
  }

  // Enhanced file analysis with Obsidian patterns
  analyzeFile(filePath, content) {
    const baseAnalysis = this.baseAnalyzeFile(filePath, content);
    const obsidianCompliance = this.analyzeObsidianCompliance(
      content,
      filePath
    );

    return {
      ...baseAnalysis,
      obsidianCompliance,
    };
  }

  // Base analysis from previous analyzer
  baseAnalyzeFile(filePath, content) {
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
      obsidianPatterns: this.findObsidianPatterns(content),
    };
  }

  findObsidianPatterns(content) {
    return {
      componentExtends: (
        content.match(/extends\s+(Component|Plugin|Modal|ItemView)/g) || []
      ).length,
      properEventHandling: (
        content.match(/register(Event|DomEvent|Interval)/g) || []
      ).length,
      vaultOperations: (content.match(/app\.vault\./g) || []).length,
      workspaceUsage: (content.match(/app\.workspace\./g) || []).length,
      settingsUsage: (content.match(/(loadData|saveData)/g) || []).length,
      noticeUsage: (content.match(/new Notice\(/g) || []).length,
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
    const complexityKeywords =
      /\b(if|else|while|for|switch|case|catch|&&|\|\||\?)\b/g;
    const matches = content.match(complexityKeywords) || [];
    return matches.length + 1;
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

  // Main analysis runner
  async analyze() {
    console.log("🔍 Starting Habsiad Obsidian Compliance Analysis...\n");

    // Walk through source files
    this.walkDirectory(this.srcPath);

    // Extract compliance data
    const allCompliance = Object.values(this.results.files).map(
      (f) => f.obsidianCompliance
    );

    // Generate Obsidian-specific recommendations
    this.results.obsidianRecommendations =
      this.generateObsidianRecommendations(allCompliance);

    // Calculate metrics
    this.calculateMetrics();

    // Generate comprehensive report
    this.generateComplianceReport();
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
        this.results.files[relativePath] = this.analyzeFile(filePath, content);
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
      obsidianCompliance: {
        properComponents: files.filter(
          (f) => f.obsidianPatterns.componentExtends > 0
        ).length,
        eventManagement: files.reduce(
          (sum, f) => sum + f.obsidianPatterns.properEventHandling,
          0
        ),
        vaultUsage: files.reduce(
          (sum, f) => sum + f.obsidianPatterns.vaultOperations,
          0
        ),
        noticeUsage: files.reduce(
          (sum, f) => sum + f.obsidianPatterns.noticeUsage,
          0
        ),
      },
    };
  }

  generateComplianceReport() {
    const report = `
# Habsiad Obsidian Plugin Compliance Analysis
Generated: ${new Date().toISOString()}

## 📊 Project Metrics
- **Total Files**: ${this.results.metrics.totalFiles}
- **Total Lines**: ${this.results.metrics.totalLines.toLocaleString()}
- **Code Lines**: ${this.results.metrics.totalCodeLines.toLocaleString()}
- **Average Complexity**: ${this.results.metrics.averageComplexity.toFixed(2)}

## 🎯 Obsidian API Compliance Score

### ✅ Compliance Strengths
- **Proper Components**: ${
      this.results.metrics.obsidianCompliance.properComponents
    }/${this.results.metrics.totalFiles} files extend Obsidian classes
- **Event Management**: ${
      this.results.metrics.obsidianCompliance.eventManagement
    } proper event registrations
- **Vault Operations**: ${
      this.results.metrics.obsidianCompliance.vaultUsage
    } vault API usages
- **User Feedback**: ${
      this.results.metrics.obsidianCompliance.noticeUsage
    } Notice instances

## 🏗️ Detailed File Analysis

${Object.entries(this.results.files)
  .map(
    ([file, data]) => `
### ${file}
- **Lines**: ${data.totalLines} (${data.codeLines} code)
- **Complexity**: ${data.complexity}
- **Obsidian Patterns**:
  - Component extends: ${data.obsidianPatterns.componentExtends}
  - Event handling: ${data.obsidianPatterns.properEventHandling}
  - Vault operations: ${data.obsidianPatterns.vaultOperations}
  - Workspace usage: ${data.obsidianPatterns.workspaceUsage}

**Compliance Issues**:
${
  data.obsidianCompliance.performanceIssues
    .map((issue) => `- ⚠️ ${issue.type}: ${issue.description}`)
    .join("\n") || "- ✅ No major compliance issues found"
}

**Best Practices**:
${
  data.obsidianCompliance.bestPractices
    .map((practice) => `- ✅ ${practice.type}: ${practice.description}`)
    .join("\n") || "- No specific best practices detected"
}
`
  )
  .join("")}

## 🎯 Obsidian Plugin Recommendations

${this.results.obsidianRecommendations
  .map(
    (rec) => `
### ${rec.priority.toUpperCase()} PRIORITY: ${rec.title}
**Category**: ${rec.category}
**Issue**: ${rec.description}
**Example**: \`${rec.example}\`
`
  )
  .join("")}

## 📋 Obsidian Plugin Submission Checklist

### ✅ Code Quality Standards
- [ ] **TypeScript Usage**: All files use proper TypeScript with Obsidian types
- [ ] **Error Handling**: All API calls wrapped in try-catch blocks
- [ ] **Component Lifecycle**: Proper extension of Obsidian base classes
- [ ] **Event Management**: All events registered via Obsidian methods for cleanup
- [ ] **Resource Cleanup**: No memory leaks from unregistered listeners

### ✅ API Best Practices
- [ ] **Vault Operations**: Use app.vault methods instead of file system access
- [ ] **DOM Manipulation**: Use createEl/find instead of document methods
- [ ] **Settings Persistence**: Use loadData/saveData for plugin settings
- [ ] **User Feedback**: Appropriate use of Notice for user communication
- [ ] **Performance**: Avoid blocking operations on main thread

### ✅ Plugin Standards
- [ ] **Manifest Compliance**: Proper manifest.json with required fields
- [ ] **README Documentation**: Clear installation and usage instructions
- [ ] **Version Management**: Proper semver and versions.json
- [ ] **GitHub Releases**: Automated release process with assets
- [ ] **Community Guidelines**: Follows Obsidian community plugin standards

## 🔧 Immediate Action Items

1. **High Priority Fixes**:
${
  this.results.obsidianRecommendations
    .filter((r) => r.priority === "high")
    .map((r) => `   - ${r.title}`)
    .join("\n") || "   - No high priority issues found"
}

2. **Medium Priority Improvements**:
${
  this.results.obsidianRecommendations
    .filter((r) => r.priority === "medium")
    .map((r) => `   - ${r.title}`)
    .join("\n") || "   - No medium priority issues found"
}

3. **Code Quality Enhancements**:
   - Implement comprehensive TypeScript types for all Habitica API responses
   - Add proper error boundaries for all external API calls
   - Ensure all DOM operations use Obsidian's helper methods

## 📚 Obsidian Plugin Resources

- **Official Docs**: https://docs.obsidian.md/Plugins
- **API Reference**: https://github.com/obsidianmd/obsidian-api
- **Plugin Guidelines**: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- **Community Examples**: https://github.com/obsidianmd/obsidian-releases
- **Development Guide**: https://docs.obsidian.md/Plugins/Getting+started

---
*This analysis ensures your plugin meets Obsidian's quality standards and community guidelines.*
`;

    // Write report to file
    fs.writeFileSync("OBSIDIAN_COMPLIANCE_ANALYSIS.md", report);

    console.log("✅ Obsidian Compliance Analysis complete!");
    console.log("📄 Report generated: OBSIDIAN_COMPLIANCE_ANALYSIS.md");
    console.log("\n📋 Quick Compliance Summary:");
    console.log(
      `- ${this.results.metrics.obsidianCompliance.properComponents}/${this.results.metrics.totalFiles} files properly extend Obsidian classes`
    );
    console.log(
      `- ${this.results.metrics.obsidianCompliance.eventManagement} proper event registrations found`
    );
    console.log(
      `- ${this.results.obsidianRecommendations.length} recommendations for improvement`
    );

    const highPriorityIssues = this.results.obsidianRecommendations.filter(
      (r) => r.priority === "high"
    ).length;
    if (highPriorityIssues > 0) {
      console.log(
        `⚠️  ${highPriorityIssues} high priority compliance issues need attention`
      );
    } else {
      console.log("✅ No high priority compliance issues found!");
    }
  }
}

// Run the enhanced analysis
const analyzer = new ObsidianComplianceAnalyzer();
analyzer.analyze().catch(console.error);

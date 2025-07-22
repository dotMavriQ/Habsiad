# Habsiad Plugin Deployment Guide

## Overview

This repository uses a dual-branch deployment system to separate development from distribution:

- **`main` branch**: Contains source code, development files, and build configuration
- **`release` branch**: Contains only compiled plugin files for Obsidian Community Plugin submission

## Repository Structure

### Main Branch (`main`)
```
├── src/                          # TypeScript source code
│   ├── main.ts                   # Main plugin entry point
│   ├── settings.ts               # Plugin settings
│   ├── habitica/                 # Habitica API integration
│   ├── utils/                    # Utility functions
│   └── views/                    # UI components
├── .github/workflows/            # GitHub Actions
├── deploy.sh                     # Deployment automation script
├── package.json                  # npm configuration
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── webpack.config.js             # Webpack build configuration
├── manifest.json                 # Plugin metadata (source)
├── styles.css                    # Plugin styles (source)
├── LICENSE                       # License file
├── README.md                     # Development documentation
└── node_modules/                 # Development dependencies (ignored in release)
```

### Release Branch (`release`)
```
├── main.js                       # Compiled plugin (161 KB)
├── main.js.map                   # Source map for debugging
├── manifest.json                 # Plugin metadata
├── styles.css                    # Plugin styles
├── LICENSE                       # License file
└── README.md                     # User documentation
```

## Build System

### Prerequisites
- Node.js and npm installed
- Dependencies installed: `npm install`

### Build Process
The build uses webpack to compile TypeScript to JavaScript:

```bash
# Development watch mode
npm run dev

# Production build
npm run build

# Full deployment (build + release branch creation)
npm run deploy
```

### Build Scripts in package.json
```json
{
  "scripts": {
    "dev": "./node_modules/.bin/webpack --watch",
    "build": "./node_modules/.bin/webpack",
    "deploy": "bash ./deploy.sh"
  }
}
```

**Note**: We use `./node_modules/.bin/webpack` instead of `npx webpack` due to global npx conflicts.

## Deployment Process

### Automated Deployment (`npm run deploy`)

The `deploy.sh` script performs these steps:

1. **Validation**: Checks git working directory is clean
2. **Build**: Compiles TypeScript to JavaScript using webpack
3. **Version Detection**: Extracts version from `manifest.json`
4. **Main Branch Update**: Commits any build changes to main branch
5. **Release Branch Creation**: 
   - Creates orphan `release` branch (or cleans existing one)
   - Copies only distribution files to temporary directory
   - Excludes all development files and `node_modules`
6. **Release Commit**: Creates clean commit with only plugin files
7. **Tagging**: Creates and pushes version tag (e.g., `v1.5.2`)
8. **Push**: Updates remote `release` branch and tags
9. **Local Plugin Update**: Updates local Obsidian plugin if path exists

### Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. Ensure clean working directory
git status

# 2. Build the plugin
./node_modules/.bin/webpack

# 3. Switch to release branch (create if doesn't exist)
git checkout release || git checkout --orphan release

# 4. Clean release branch
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# 5. Copy only distribution files from main branch
git checkout main -- main.js main.js.map manifest.json styles.css LICENSE

# 6. Create release-specific README
# (Create appropriate README.md for users)

# 7. Commit and push
git add .
git commit -m "Release version X.X.X - compiled plugin files"
git push origin release

# 8. Create and push tag
git tag vX.X.X
git push origin vX.X.X

# 9. Return to main
git checkout main
```

## Key Files

### deploy.sh
- **Purpose**: Automated deployment script
- **Key Features**:
  - Uses temporary directory to prevent contamination
  - Excludes development dependencies
  - Creates clean release commits
  - Handles both new and existing release branches

### .github/workflows/release.yaml
```yaml
name: Release Plugin
on:
  push:
    tags: ["*"]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3
        with:
          ref: release  # ← Uses release branch, not main
      - name: Package Release Artifact
        run: |
          mkdir habsiad
          cp main.js manifest.json styles.css habsiad/
          zip -r habsiad.zip habsiad/
      - name: Create GitHub Release
        uses: softprogs/action-gh-release@v2
        with:
          files: habsiad.zip
```

**Critical**: GitHub Actions checks out the `release` branch, not `main`, so it gets pre-compiled files.

## Obsidian Community Plugin Submission

### For Official Plugin Repository Submission:

1. **Repository**: `dotMavriQ/Habsiad`
2. **Branch**: `release` (NOT main)
3. **Required Files** (all present in release branch):
   - ✅ `main.js` - Compiled plugin code
   - ✅ `manifest.json` - Plugin metadata
   - ✅ `styles.css` - Plugin styles

### Validation Requirements Met:
- ❌ No TypeScript source files
- ❌ No `node_modules` directory  
- ❌ No build configuration files
- ✅ Only compiled, distribution-ready files
- ✅ Single clean commit per version
- ✅ Proper versioning with git tags

### Update PR #7175:
- Change repository branch from `main` to `release`
- All validation checks should now pass

## Troubleshooting

### "webpack: command not found"
```bash
# Use local webpack instead of global
./node_modules/.bin/webpack

# Or reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Working directory not clean"
```bash
# Check what files are modified
git status

# Commit or stash changes
git add .
git commit -m "Your commit message"
# OR
git stash
```

### Release branch contains unwanted files
```bash
# Delete and recreate release branch
git branch -D release
git push origin :release
npm run deploy
```

### Local plugin not updating
Update the `PLUGIN_PATH` variable in `deploy.sh` to point to your local Obsidian plugins directory.

## Development Workflow

### Daily Development:
1. Work on `main` branch
2. Make changes to TypeScript source files
3. Test with `npm run dev` (watch mode)
4. Commit changes to main branch

### Release Process:
1. Update version in `manifest.json`
2. Update `README.md` if needed
3. Run `npm run deploy`
4. Verify release branch contains only distribution files
5. GitHub Actions will automatically create release when tag is pushed

### Emergency Fixes:
If you need to quickly fix the release branch:
```bash
git checkout release
# Make minimal changes to compiled files
git add .
git commit -m "Hotfix: description"
git push origin release
git checkout main
```

## File Exclusions

The deployment system automatically excludes:
- `src/` directory (TypeScript source)
- `node_modules/` (development dependencies)
- `.github/` (except workflows may be copied)
- `package.json` and `package-lock.json`
- `tsconfig.json`
- `webpack.config.js`
- `deploy.sh`
- Development-only files

Only these files are included in release branch:
- `main.js` (compiled plugin)
- `main.js.map` (source map)
- `manifest.json` (plugin metadata)
- `styles.css` (plugin styles)
- `LICENSE` (license file)
- `README.md` (user-facing documentation)

---

## Summary

This deployment system ensures clean separation between development and distribution, meeting all Obsidian Community Plugin requirements while maintaining a professional development workflow.

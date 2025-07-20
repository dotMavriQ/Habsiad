
# Habsiad 1.5.2

<div align="center">
  <svg width="120" height="160" viewBox="0 0 180 240" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <clipPath id="h-cutout">
        <path d="M0,0 H180 V240 H0 Z M75,95 V145 H85 V125 H95 V145 H105 V95 H95 V115 H85 V95 Z" />
      </clipPath>
    </defs>
    <g fill="#1c1c1c">
      <path d="M50,230 C0,200 0,100 50,60 L50,40 C50,10 70,10 90,10 C110,10 130,10 130,40 L130,60 C180,100 180,200 130,230 Z" />
    </g>
    <g clip-path="url(#h-cutout)">
      <path fill="#D95737" d="M50,215 C20,190 20,110 50,80 L130,80 C160,110 160,190 130,215 Z" />
    </g>
    <g fill="none" stroke="#1c1c1c" stroke-width="4">
        <line x1="50" y1="80" x2="130" y2="80" />
        <line x1="50" y1="215" x2="130" y2="215" />
    </g>
    <g fill="#1c1c1c">
       <path d="M50,110 C25,110 25,150 50,150 L50,142 C35,142 35,118 50,118 Z" />
       <path d="M130,110 C155,110 155,150 130,150 L130,142 C145,142 145,118 130,118 Z" />
    </g>
  </svg>
</div>

**Your Obsidian ⚡ Habitica Bridge**

A productivity plugin for [Obsidian](https://obsidian.md/) that bridges the gap between note-taking and gamified habit tracking through [Habitica](https://habitica.com/).

---

## 📦 Installation

### Method 1: BRAT (Beta Reviewer's Auto-update Tool) - Recommended
1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Community Plugins
2. Add this repository: `https://github.com/dotMavriQ/Habsiad`
3. Enable the plugin in Community Plugins settings

### Method 2: Manual Installation
1. Download the latest `habsiad.zip` from [Releases](https://github.com/dotMavriQ/Habsiad/releases)
2. Extract to your vault's `.obsidian/plugins/` directory
3. Enable the plugin in Community Plugins settings

> **Note**: Version 1.5.2 includes BRAT compatibility improvements. Earlier versions (1.5.1) required manual installation.

---

## What is Habsiad?

Habsiad is an _opinionated_ productivity plugin that establishes **predefined standards** to operate efficiently while remaining as modular as possible within these confines.

Originally developed as a bridge between Obsidian and Habitica, **Habsiad is a complete productivity suite that functions regardless of whether you use Habitica** daily, often, or at all.

### Core Philosophy

Habitica handles three main productivity stacks:
- **Habits**: Things that are generally good to do as often as possible
- **Dailies**: Things you want to be penalized for not achieving every day  
- **TODOs**: Unique one-off tasks that can have subtasks

Habsiad addresses Habitica's biggest flaw: **it doesn't store your progress over time**. With Habsiad, you can import your achieved Habits & Dailies FROM Habitica INTO your Obsidian journal entries.

---

## 🚀 Getting Started

### Requirements
1. **Obsidian vault** with a folder called `Journal`, `journal`, or `JOURNAL` in your vault root
2. **Daily journal files** named in `YYYY-MM-DD.md` format (use [Calendar plugin](https://github.com/liamcain/obsidian-calendar-plugin) for convenience)
3. **Template structure** following Habsiad standards

### For Habitica Integration (Optional)
- [Habitica account](https://habitica.com/register)
- [Habitica User ID and API Token](https://habitica.fandom.com/wiki/API_Options)

### Template Setup
Create a template file in `TEMPLATES/journal` with this structure:

```markdown
---
3meals:
bed:
book:
trash:
walk:
workout:
steps:
weight:
---
# {WEEKDAY}
## WORK:
###### Summary:

### Goals for Today:
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## LIFE:

### FOOD:
| ⌚         | MEAL | EST.CALORIES |
| --------- | ---- | ------------ |
| Breakfast |      |              |
| Lunch     |      |              |
| Dinner    |      |              |
| Snacks    |      |              |

### TODO:

## Reflections:
```

---

## 🎯 Features

### Core Tabs

#### 🏡 **Home Tab**
- Plugin information and version number
- Quick access to settings and Habitica
- Elegant Greek vase logo with carved-out H design

#### 🔎 **Data Quality Diagnostics**  
- Birds-eye view of journal entries and their data quality
- Dynamically generated insights about your daily notes
- Identify missing or incomplete entries

#### ⬆️ **Frontmatter Glossary**
- Map Habitica Keys to Frontmatter Keys for synchronization
- "Sync Habitica to Frontmatter" button for batch processing
- Enable data visualization with plugins like [Tracker](https://github.com/pyrochlore/obsidian-tracker)

#### 🏷️ **Labels Tab** *(New in 1.5.1)*
Track anything with emoji-based labels in your journal entries:

```markdown
* Today I ate eight waffles again... `🧇: 8`
* Indoor temperature was perfect today `🌡️: 22`
* Bathroom visits (don't judge) `🚽: 4`
```

- Automatically scans and aggregates label data
- Chronological rundown when clicked
- Perfect for tracking temperature, humidity, habits, or any quantifiable data

#### 📔 **Logs Tab** *(New in 1.5.1)*
Create specialized logs using [Obsidian Callouts](https://help.obsidian.md/callouts):

```markdown
> [!DREAM] #### Underwater Nightmare
> I was navigating a tunnel underwater with people from high school...
> 
> ![[Dream_20240205_underwaternightmare.png]]

> [!WORKOUT] #### Morning Run
> 5K run in 25 minutes. Felt great despite the rain!
```

- Supports any callout type: DREAM, WORKOUT, MEETING, etc.
- Chronological organization of related logs
- Click to navigate back to original journal entry

### Optional Tabs

#### 👟 **Steps** *(Optional)*
- Manual step count input from fitness apps
- Data stored in frontmatter for visualization
- Supports Google Fit, Samsung Health, Zepp Life, etc.

#### ⚖️ **Weight** *(Optional)*  
- Simple weight tracking in kilograms
- Frontmatter storage for trend analysis

#### 🍔 **Calories** *(Optional)*
- Track calorie intake with "Calculate totals" button
- Automatically extracts and sums EST.CALORIES from food tables
- Integrates with your meal tracking workflow

#### 🍺 **Alcohol Tracker** *(Optional)*
- Scans journal entries for alcohol-related emojis
- Graphical representation of consumption patterns
- Linear listing by date for awareness tracking

---

## 🎮 Habitica Integration

### Sync Features
- **Import Habits & Dailies**: Bring completed items into your journal
- **TODO Sync**: One-way sync from Habitica to Obsidian  
- **Automatic Weekday Updates**: Template placeholders like `{WEEKDAY}` auto-update
- **Progress Preservation**: Store your Habitica achievements permanently in Obsidian

### The Retrotagger
**Emancipate yourself from Habitica dependency!**

- Retroactively enter Habits & Dailies at the end of any journal entry
- Perfect for when you forget to log in Habitica
- Enables "productivity without gamification" while maintaining achievement-based format
- Stores your own Habits & Dailies list for consistent tracking

---

## ⌨️ Keyboard Shortcuts

All commands are fully customizable in settings:

- **Generate Habits & Dailies**: `Ctrl/Cmd+Shift+H`
- **Replace {WEEKDAY} with Actual Day**: `Ctrl/Cmd+Shift+D`  
- **Sync Habitica TODO**: `Ctrl/Cmd+Shift+Y`
- **Sync Habitica to Frontmatter**: `Ctrl/Cmd+Shift+Q`
- **Calculate Calorie Totals**: `Ctrl/Cmd+Shift+C`

---

## 🔧 Configuration

### Journal Setup
- Journal folder: Configurable (default: `Journal`)
- File naming: `YYYY-MM-DD.md` format required
- Template structure: Follow Habsiad standards for best results

### Optional Features
Toggle any optional tabs on/off based on your needs:
- Steps tracking
- Weight monitoring  
- Calorie calculation
- Alcohol tracking

### Habitica API (Optional)
- User ID and API Token from your Habitica account
- Required only for Habitica integration features
- Plugin works fully without Habitica credentials

---

## 💡 Pro Tips

- Use [Emoji Toolbar plugin](https://github.com/oliveryh/obsidian-emoji-toolbar) for convenient emoji entry
- Combine with [Calendar plugin](https://github.com/liamcain/obsidian-calendar-plugin) for seamless daily note creation
- Leverage [Tracker plugin](https://github.com/pyrochlore/obsidian-tracker) to visualize your frontmatter data
- Set consistent daily journaling times for best habit formation

---

## 📈 What's New in 1.5.2

### ✨ New Features (1.5.1)
- **Labels Tab**: Emoji-based tracking for any quantifiable data
- **Logs Tab**: Organized callout-based logging system  
- **Greek Vase Logo**: Beautiful carved-out H design
- **Enhanced UI**: Improved Home tab with responsive design

### 🔧 Improvements (1.5.2)
- **BRAT Compatibility**: Fixed plugin packaging for Git-based installation
- **Streamlined Deployment**: Simplified release pipeline
- **Better Documentation**: Updated README with comprehensive wiki content

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your Habsiad workflows and templates

Visit our [GitHub repository](https://github.com/dotMavriQ/Habsiad) and [Wiki](https://github.com/dotMavriQ/Habsiad/wiki) for more information.

---

## 💖 Support

If you benefit from Habsiad, please consider supporting its development:

<a href="https://liberapay.com/dotMavriQ/donate"><img alt="Donate using Liberapay" src="https://img.shields.io/liberapay/patrons/dotMavriQ.svg?logo=liberapay"></a>

---

## 📞 Contact

- **Issues & Support**: [GitHub Issues](https://github.com/dotMavriQ/Habsiad/issues)
- **Email**: [habsiad+dotmavriq@gmail.com](mailto:habsiad+dotmavriq@gmail.com)
- **Documentation**: [Wiki](https://github.com/dotMavriQ/Habsiad/wiki)

---

<div align="center">
Made with ❤️ by <a href="https://github.com/dotMavriQ">dotMavriQ</a>
</div>


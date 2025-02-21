# Obsitica

Obsitica is an [Obsidian](https://obsidian.md/) plugin that integrates [Habitica](https://habitica.com) with Obsidian, allowing you to store your tracked habits and dailies directly within your Obsidian notes. 

While [The Habitica Sync Plugin for Obsidian](https://github.com/SuperChamp234/habitica-sync) is an endearing endeavour that deserves respect in its own right, I personally never found that I could utilize it to become more productive while using Obsidian.

### Obsidian + Habitica - Match made in heaven
Between 2020 and 2024, I struggled to find a sustainable approach to improve my habits and work diligently toward achieving my goals.

A habit tracker is a valuable tool, and I discovered that combining it with self-authoring (keeping a journal) maximizes my incentives to stay on track and record my achievements and progress for posterity.

With the help of my partner—adding a social incentive—we embarked on a journey of using Habitica together, which I found immensely helpful.

Habitica offers three areas for life improvement: Habits, Dailies, and To-Dos:

- A **Habit** is something you aim to do regularly and want to encourage yourself to do more often.
- A **Daily** is a habit that you wish to hold yourself accountable for completing every day.
- A **To-Do** is a one-time task that needs to be completed by a specific deadline.

However, I occasionally drifted away from Habitica, growing tired of maintaining it—especially the To-Dos, which can become tedious to create, manage, and clear efficiently.

The biggest drawback of Habitica for me is that my history of progress, or lack thereof, isn't stored anywhere. But it does have a public API for that data.

When I tried other alternatives on the market, even the best paid options lacked features that Habitica excels at, namely:

- The user interface is quite intuitive, even compared to paid alternatives.
- The gamification aspect helped me develop the habit of creating and maintaining habits when I started.
- You can set your own "Reset Time," which is crucial for anyone who doesn't end their day precisely at midnight, as I rarely do.
- It has a public API.

So, what if I could merge the two? Achieving my ideal vision of productivity wouldn't happen immediately, but I could at least write a script to extract my daily achievements and tracked habits into a piece of standardized markdown to paste at the bottom of my daily journal each day.

This script evolved into [Obsitica-Web](https://dotmavriq.github.io/Obsitica-Web/), providing an interface that I could use on mobile with relative ease.

As of the end of October 2024, Obsitica has reached a stage where it can provide the same functionality. The next step is to develop this plugin further into one of, at most, four plugins I need for my optimal productivity flow.

## Features

- **Generate Habits & Dailies**: Fetch your completed habits and dailies from Habitica and insert them into your daily journal notes.
- **Customizable Journal Folder**: Specify the folder where your daily journal notes are stored.
- **Sidebar View**: Access plugin information and future features via the Obsitica sidebar.
  - **Info Tab (ℹ️)**: View plugin details, version, and available shortcuts.
  - **Data Quality Diagnostics (🔎)**: *(Coming Soon)* Analyze your data quality within Obsidian.
  - **Frontmatter Glossary (⬆️)**: *(Coming Soon)* Manage frontmatter properties across your notes.

## Installation

### 1. Download the Plugin

- Clone or download the Obsitica plugin repository to your local machine.

### 2. Build the Plugin

- **Navigate** to the plugin directory in your terminal.
- **Install dependencies**:

  ```bash
  npm install


  <sub><sup>shoutouts to the bold and brave people with decked out [emacs ORG-mode](https://orgmode.org/) setups and people writing maniacal scripts around their [Joplin](https://joplinapp.org/) notes. We are not the same but we can share the fireplace, no doubt</sub></sup>

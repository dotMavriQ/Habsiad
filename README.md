# Obsitica

Obsitica is an [Obsidian](https://obsidian.md/) plugin that integrates [Habitica](https://habitica.com) with Obsidian, allowing you to track your habits and dailies directly within your Obsidian vault. 

While [The Habitica Sync Plugin for Obsidian](https://github.com/SuperChamp234/habitica-sync) is an endearing endeavour that deserves respect in its own right, I never found that I could utilize it to become more productive while using Obsidian.

## Obsidian + Habitica - Match made in heaven

Between the years 2020 and 2024 I struggled immensely with trying to find an approach that I would not abandon to improve my habits and working harder to achieve my goals.

A Habit Tracker is a very nice help indeed, and I have found that combining it with self-authoring (keeping a journal) maximizes MY incentives to keep my life on track and to then record my achievements and my progress for posterity.

With the aid of my partner (increased social incentive) we both underwent a journey of playing Habitica with each other. 
I found it immensely helpful. 

You have three fields for life improvement: Habits, Dailies and TODO's:
* A **Habit** is something you ought to do often and want to learn how to do more often.
* A **Daily** is a habit that you want to be penalized for not being able to attain on a daily basis.
* A **TODO** is a single-use thing you need to clear within a per-case deadline.

Every now and then I would drop out of Habitica though, I would grow tired with having to maintain it... Especially the TODO's can become quite nauseating to create, maintain and clear in an efficient manner.

The single biggest flaw with Habitica in particular, FOR ME, is that my history of progress, or lack thereof, isn't kept anywhere. BUT. IT HAS A PUBLIC API FOR SAID DATA.

And when I tried every other alternative on the market I found that even the best paid options lack things that Habitica has solved, namely:
* The UI is honestly quite intuitive compared to even paid alternatives.
* The gamification actually helped to create the habit of creating and maintaining habits when I started out.
* You can set your own "Reset Time", this is very important for any person who does not obsessively "quit their day" at `00:00`, which I rarely, if ever, do.
* IT HAS A PUBLIC API

So... What if I could merge the two? 
Doing so in a means that would satisfy my every ideal vision of productivity would not happen in early 2024.
But I could at least write a script that would squeeze out my daily achievements and habits tracked into a piece of "standardized" markdown for me to paste at the bottom of my daily journal each day.

This script would then develop into [Obsitica-Web](https://dotmavriq.github.io/Obsitica-Web/), which gave me an interface so I could use it on mobile as well with relative ease.

And since the end of October 2024, Obsitica is finally in a stage where it can also provide the exact same functionality.
The only thing left is to slowly turn this plugin into one out of, at most, 4 plugins that I need in order to have my optimal productivity flow.

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

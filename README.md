
# Obsitica

The missing tool for the Obsidian + Habitica productivity stack!

---
## What is Obsitica?
Obsitica is a plugin for [Obsidian](https://obsidian.md/) that interact with the [Habitica API](https://habitica.com/apidoc/), and other things to enhance journaling and local data insights. 

If you want the elevator pitch, keep reading.

### Introduction 
[dotMavriQ](https://github.com/dotMavriQ), the author of the plugin, found himself hunting for a productivity-stack that would allow him to journal as efficiently as possible with modern and simple tools that works well on PC and mobile. 

After years of testing, he eventually landed on using **Habitica** for *habit-tracking* and **Obsidian** for *journaling*.

#### Why Obsidian?

Obsidian is in essence nothing more than an application to edit [markdown](https://en.wikipedia.org/wiki/Markdown)-files. It also presents said [markdown](https://en.wikipedia.org/wiki/Markdown)-files in an aesthetically pleasing way, *arguably*.

Because of how brutally simple yet extensive it is, it opens up for a vast amount of modularity when it comes to writing down anything that is of interest to you. 

Linking between documents, searching text across all files or folders, setting up logic to sort by tags, putting frontmatter in the files to store data in them... it outperforms the Google or Office suites with its minimalist approach, everything-in-one-place methodology and its modularity.

The modularity also means that as long as you find an approach that you are comfortable with, you can reduce your cognitive load by not having several parts of yourself or your work or interest placed in several files in several folders on several apps.  

Obsidian may well be the ruling application of its kind. Certainly the one with the most popular use.

**A short set of arguments as to why follows below:**
* While not open-source, it still has **too many good features** over open-source competitors like [Logseq](https://logseq.com/).
* The biggest competitor in app-for-desired-outcomes is arguably [Notion](https://www.notion.com/) however. **Notion is Software as a Service**. This means that it has implicit or explicit limits to the amount of data you can store, they can also revoke your right to access said data for reasons they can invent whenever they want. They could also close their service at any moments notice, leaving you without your preciously crafted data. **You should always own your own valued data**.

<sub><sup>shoutouts to the bold and brave people with decked out [emacs ORG-mode](https://orgmode.org/) setups and people writing maniacal scripts around their [Joplin](https://joplinapp.org/) notes. We are not the same but we can share the fireplace, no doubt</sub></sup>

#### Why Habitica?

Habitica is still contending to be the single most permissive and modular habit tracker released for Android as of now, and so that's where the focus went.

**A short set of arguments as to why follows below:**

* **The separation of concerns**. Comprehending what ought to be a `Habit`, what should be a `Daily` and what should be in `TODO` is a sane standard to operate under.
* Unlike most (even premium) habit trackers, Habitica **allows you to set your own Start-of-day**. The best selling Habit Trackers are still so caveman that they set you to a new day, so you can't even log that you brushed your teeth before bed at `00:01`.  
* Unlike some (even premium) habit-trackers, **[Habitica has a Web View](https://habitica.com/)**.
* And the final golden argument for Habitica, that even mitigates most if not all of its shortcomings: **IT HAS AN API**. 

#### Why Obsitica? 
Well... The Obsidian + Habitica stack, with all of its strengths, still has some flaws.

- **Obsidian can't indirectly interact with Habitica**. Someone has made [a plugin prior to Obsitica](obsidian://show-plugin?id=obsidian-habitica-integration), but the plugin is essentially none more than a web view of Habitica itself, avaible to be viewed from within Obsidian. Which is fine for a lot of people I bet... but it doesn't solve my single biggest problem:
- **Habitica does not store your tracked Habits, Dailies and TODO's in any meaningful way** - Yeah, you read that right. So... it's effective with its UI and gamification... but unless you're happy with looking at streak numbers for individual Habits, Dailies... or looking through your archived TODO's...you have no means of evaluating your work... or your progress over time, not unless you do your own data entry or toil with notebooks.

So what if we could leverage the fact that we can make calls to the Habitica API so that we can store our achieved Habits, Dailies and TODO's and then graph progress over time? 

That would leave us with a setup where we can leverage the strengths and modularity of Obsidian with the neat UI and simplicity of Habitica.

And that, among every other concern over missing productivity functionality, is why Obsitica exists.

---
##### Obsitica is an opinionated plugin:
Because Obsitica tries to take wonderful and modular approaches and the simplicity of using Habitica into an experience that is permissive yet simple, it has to establish some standards that it adheres to. 

**This includes, but is not limited to:**

- The template you use to fill out your daily journal entries.
- The order of the headers inside of it. 
- What you name your journal folder
- the naming conventions of files in your daily journal folder (Obsitica accepts `YYYY-MM-DD.md`)
- Some formatting rules need to be abided in order to retain data insights the plugin provides.

[More about this in the Wiki!](https://github.com/dotMavriQ/Obsitica/wiki/Getting-Started) 


### Current Version 0.8.6

Obsitica has now entered version `0.8.6` 

We are getting ever closer to `1.0` 

**Here is a list of everything that Obsitica already allows you to do:** 

- **Home Tab** - Contains version number and display available shortcuts.
- **Data Quality Diagnostics** - Gives you an overview of the quality of your data for each date. 8 columns of dynamically generated insights into the quality of your daily notes.
- **Frontmatter Glossary** - Reads the Frontmatter Keys from your daily journal files and allows you to assign aliases that align with the names of your Habits & Dailies.
- **Steps** Allows you to manually enter the step count you gather from sources like *Google Fit*, *Samsung Health* or *Zepp Life* et. c. (currently hardcoded to alter Frontmatter Key `steps`). 

**Furthermore, you can also:**
- Enter in your *Habitica User ID* and *API Token* into settings. With them in place you can hit a keyboard shortcut to paste your **Habits & Dailies** from Habitica into your daily journal file just like that! (You can test it out in [Obsitica-Web](https://dotmavriq.github.io/Obsitica-Web/))
- automatically switch out your H1 Weekday header(, templated as {WEEKDAY},) into the correct weekday dynamically by entering a keyboard shortcut. New entries generated (from the [Calendar plugin](https://github.com/liamcain/obsidian-calendar-plugin) or otherwise) also automatically get this treatment as it is a desired default.


### What's next?

In order for this plugin to reach `1.0.0` we have some improvements and features that need to be put in place.

- **The Sync feature** - With **Frontmatter Glossary** we have the means to set aliases, or "Habitica Keys" that correspond with the **Frontmatter Keys** we have present in our journal entries. The Sync feature would simply read each daily journal entry, do the math on the values for the Habitica Habits & Dailies and convert their values onto the frontmatter. Once done, we can leverage things like the [Tracker plugin](https://github.com/pyrochlore/obsidian-tracker) to make progress graphs for any Habit or Daily that we so desire!
- **The TODO Sync needs to be improved** - it currently "works" but does not retain checked checkboxes if one syncs twice in the same document. In short, it needs improvements.  
- We need to sort out a **pesky bootup bug** where the dynamic {WEEKDAY} replacer runs across all files inside of our Journal folder.

## Contributing

Please feel free to try this plugin! 

dotMavriQ will eagerly answer any pending questions either on GitHub or via [email](mailto:obsitica+dotmavriq@gmail.com)

And if you like the idea, or better yet, benefit from the plugin, please feel free to donate:

<noscript><a href="https://liberapay.com/dotMavriQ/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a></noscript>

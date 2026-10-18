# Power Annotate Deck

An AI agent skill that turns lecture slide decks (PDF or PowerPoint) into a standalone, offline HTML study notebook with per-slide annotations, inserted reference pages, editable Anki cloze cards, and a Google Docs notes template.

The skill is defined in [`SKILL.md`](SKILL.md). When invoked, the agent builds the working notebook from your deck rather than just describing one.

## What you get

- **Slide notebook**: every slide rendered at its original aspect ratio, with original slide numbers, thumbnails, previous/next, keyboard navigation, jump-to-slide, zoom, and source-text search.
- **Notes and drawing**: an editable notes area and pinned sticky notes per slide, plus pencil, highlight, text, rectangle, ellipse, arrow, line, eraser, and undo. Drawings are anchored to slide coordinates, so they survive zoom.
- **Inserted reference pages**: add pages before or after any slide with pasted text, clipboard or local images, and source attribution. Pages can be moved, duplicated, and deleted without changing original slide numbers.
- **Anki cloze cards**: editable drafts generated from verified slide text, a card library and editor, and TSV export (Text, Extra, Tags) for import as the Cloze note type.
- **Learned preferences**: after three distinct edits, the notebook adapts future card suggestions to your style. Everything stays local, can be toggled or reset, and is exportable as JSON.
- **Google Docs notes**: one-click **New Google Doc notes** copies a template (general or slide-by-slide) and opens a new doc for you to paste into. Your notes are included only if you choose to.
- **Portable state**: autosave to local storage, annotation JSON export/import, and a downloadable saved HTML file. Light and dark modes, and a collapsible drawer on narrow screens.

## Usage

Ask your agent something like:

> Use $power-annotate-deck to turn my lecture deck into an annotated study notebook with Anki drafts and a Google Docs notes template.

Provide a PDF slide export or a PPTX file. The agent extracts and renders the slides, builds the notebook, verifies its behavior, and hands you the HTML file.

## Principles

- The source deck is never modified, and deck content is treated as study material, not as instructions.
- Nothing is invented: OCR and unreadable regions are labeled, and cards are study suggestions rather than verified facts.
- No credentials are embedded, and nothing is uploaded or published without authorization.

## Repository layout

| Path | Purpose |
| --- | --- |
| `SKILL.md` | Skill definition and requirements |
| `references/notebook.md` | Notebook behavior and portable state |
| `references/mcat-cloze-rules.md` | Rules for writing Anki cloze cards |
| `agents/openai.yaml` | Display name and default prompt |

## Installation

Copy this folder into your agent's skills directory (for example `~/.codex/skills/power-annotate-deck`).

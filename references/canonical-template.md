# The approved notebook is the design source

Use `assets/notebook-template.html` through `scripts/build_notebook.py` for every new notebook. It contains the complete approved layout and runtime. Do not construct a new UI from scratch, choose another theme, or stack the older component assets on it. The current template already embeds those features. Assets for individual features remain useful only for adapting existing older notebooks.

Build:

```
python scripts/build_notebook.py --input deck.json --words words.json --output Notebook.html
```

The builder uses only the Python standard library. Render/extract slides with the relevant PDF or presentation workflow first. It refuses to overwrite an existing notebook. For a deliberate same-deck rebuild, preserve state and identity and pass `--state saved-annotations.json` to a new output file; verify restoration before replacing the old one. Different runtime state formats require an explicit migration, not silent state loss.

## Input manifest

`deck.json` contains:

- `title`: verified deck title; `filename`: original source filename.
- `id`: stable source checksum/deck identity. Supply it explicitly when upgrading; do not create a new ID to evade an existing saved state.
- `subtitle` (optional): verified title/course/lecturer metadata for the header.
- `source_path` (optional): actual source deck path relative to the manifest; it is copied beside the output for the source download. All displayed slides, annotations, and pasted assets remain embedded in the HTML. Keep this source file alongside the notebook if you want its download shortcut to work.
- `pages`: original slides in source order, each with `id`, consecutive original `number`, `title`, `text`, rendered `width`/`height`, and `image` (embedded PNG/JPEG/WebP data URL or a local image path relative to the manifest). `image_path` is also accepted. Preserve verified speaker notes as metadata when supplied.
- `cards` (optional): reviewed or heuristic drafts with `pageId`, `text`, `extra`, `tags`, `origin`, and optional stable `id`, `baseline`, `saved`. Defaults are unsaved drafts; never mark unreviewed notes saved merely to export them.
- `extraction_notice` (optional): accurate deck-specific extraction/OCR limitations.

Word geometry is a mapping from page IDs to arrays of `{text,x,y,w,h,kind}`. Coordinates are normalized to [0,1]; `kind` is `pdf` or `ocr`. Pass it using `--words` or manifest `word_data`. The existing PDF word extractor can prepare this. Do not reuse Lecture 11's word boxes, slide images, cards, or metadata for another deck.

## Keep the appearance and behavior consistent

Change content and verified metadata, not the shell, spacing, colors, toolbar positions, button wording, dropdown structure, or default visibility. The template includes the lightning logo, top page-insertion buttons, visible-by-default slide rail/progress with hide/show buttons, increasing progress glow, exact milestone messages, compact annotation tools, select/edit objects, emoji stickers, movable screenshots/text boxes, Format text/Color palette switches, simple TSV Anki export, notes/Docs/persistence tools, and Nina's credit.

Do not bring back the removed small Text tool, screenshot-specific buttons, placeholder instructions on blank pages, or ZIP/media Anki export. Make design changes only when the user requests them. When implementing a requested feature, update the canonical template and its generator if needed, not just the demonstration notebook or SKILL.md. Test the builder on another title and slide count and verify save/reopen. This keeps future outputs consistent.

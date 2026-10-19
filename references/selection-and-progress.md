# Direct slide selection and milestone behavior

## Selectable slides

An image alone cannot support text selection. Render the original slide image and overlay positioned, transparent text spans from native PDF word bounds. Normalize all x/y/width/height coordinates to the original page dimensions so text and image stay aligned across zoom and resizing. Use a selectable text layer only in Read/Select mode; drawing tools must disable its hit testing. Leave drawings and notes in their existing coordinate system. Add actual spaces and reading order so copied phrases are usable. Keep selection-to-Anki available for on-slide selections.

For diagram text baked into images, supplement native words with local OCR if available. Deduplicate overlapping native/OCR bounds. Label OCR explicitly and preserve original wording even when recognition is uncertain; do not silently correct it from guesses. If OCR is unavailable or text is unrecognized, state that limitation rather than claiming the entire slide is selectable. Never upload slides for OCR without authorization.

`scripts/extract_pdf_words.py SOURCE.pdf --output words.json [--ocr-json OCR.json]` creates normalized word metadata. It requires pdfplumber. Optional OCR JSON is an array in PDF page order containing width, height, and words with text, x, y, w, h in pixel coordinates. It can use the existing local Windows OCR workflow or another available local engine. Use real OCR output, never inferred positions.

`assets/deck-study-runtime.js` and `assets/deck-study.css` provide the tested runtime for notebooks built with this skill's D/S runtime. They expect D.pages (id, number), page(), S.active/order, el(), $(), touch(), render(), snapshot(), and original slideImage/slide/main elements, plus a JSON script with id deck-word-data mapping slide IDs to normalized word objects. Embed assets inline and adapt bindings to the actual notebook; never inject an incompatible runtime blindly. Equivalent implementations may be used with the same acceptance checks.

## Top progress meter

Display a labeled original-slide position meter in the sticky top navigation, visible even when thumbnails are hidden on mobile. Use original slide number / original slide count, a percent label, and increasing glow radius/intensity as the user advances. Label it position, not proof every earlier slide was studied. Inserted reference pages do not change the denominator; show the preceding source-slide position for them. Keep the existing visited-slide progress separate. Resizing and changing themes must retain readable labels. Respect reduced motion for transitions.

## Heart confetti milestones

On arrival at original slide ceil(N/2), show animated lavender/aqua/pink/green hearts and exactly:

> you are half way! Don't turn back

On arrival at original slide N, show animated hearts and exactly:

> You made it! Way to go big dawg!

Completion takes priority if N=1. Use each notebook's actual slide count, never hardcode Lecture 11's count. Mark each milestone once in portable notebook state so moving backward/forward or reopening does not repeatedly show it. A fresh notebook can celebrate independently. Hearts must be noninteractive; give the message a dismiss action and automatically remove the overlay after a brief interval. Reduced-motion users get static hearts and the same message. Retain separate card-save celebrations.

## Acceptance checks

- Drag the actual pointer across slide text and confirm nonempty browser selection; a transcript-only test is insufficient. Check native words, OCR diagram words, zoom alignment, and drawing-tool hit testing.
- Verify a selected on-slide phrase can become a card without changing source text.
- Visit middle and final slides and inspect exact messages and animated hearts; check larger glow values at the end, accessible progress values, responsive layout, and reduced motion.
- Save/reopen in fresh storage: one text layer, one top meter, original notes/cards intact, and milestone flags retained. Remove runtime-generated layers, meters, and celebration nodes from snapshots before rebuilding them.

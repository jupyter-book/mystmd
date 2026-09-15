---
'myst-to-typst': patch
---

Fix Typst export of cross-references whose identifier is not a valid Typst name, such as a multi-word glossary term. A reference to `term-Execution order` now emits `label("term-Execution order")` rather than an invalid angle-bracket label, and quotes and backslashes in an identifier are escaped in both the reference and its target.

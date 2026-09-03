---
'myst-to-typst': patch
---

Fix Typst PDF export of cross-references whose identifier contains spaces (e.g. multi-word glossary terms). These now emit `label("...")` instead of an invalid angle-bracket label, matching how the reference target is written.

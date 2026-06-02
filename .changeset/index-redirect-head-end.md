---
'myst-cli': patch
'mystmd': patch
---

Append the index-redirect script to the end of `<head>` instead of the beginning, so other site `<head>` content (e.g. preloads, meta tags) is not affected by the script's placement.

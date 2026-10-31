---
'myst-cli': patch
---

Only build the project page manifest for the `toc` transform on pages that contain a `toc`, avoiding quadratic memory use on large sites.

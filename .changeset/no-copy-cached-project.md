---
'myst-cli': patch
---

Return the cached project from `loadProjectFromDisk` without deep copying it, avoiding quadratic memory use on large sites.

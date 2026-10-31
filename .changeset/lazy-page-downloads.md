---
'myst-cli': patch
---

Only collect project exports when resolving a page's `downloads` if the page has `downloads`, avoiding quadratic memory use on large sites.

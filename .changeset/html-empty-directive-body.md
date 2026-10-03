---
'myst-to-html': patch
---

Write unhandled directives that have no body. An unknown directive with no body has no `value`, and HTML output failed with a `TypeError`.

---
'myst-common': patch
'myst-parser': patch
---

Undefined children still have a key defined. Delete the children if they are null-ish.

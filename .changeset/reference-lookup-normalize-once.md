---
'myst-common': patch
'myst-transforms': patch
---

Normalize a reference identifier once per lookup, not once per page.
Add `normalizeIdentifier`, which returns only the identifier part of `normalizeLabel`.

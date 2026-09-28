---
'myst-transforms': patch
---

Preserve the matched target's identifier when resolving reference links and unlinked citations. `getTarget` already tries the verbatim identifier before the normalized (lowercased) form, but the resulting cross-reference was always given the normalized identifier, so links to case-sensitive targets (e.g. Python API objects like `sample.Match` vs `sample.match` registered by plugins) silently resolved to the wrong target.

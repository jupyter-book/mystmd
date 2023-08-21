---
'myst-spec-ext': patch
'myst-cli': patch
---

Added location field to page data, dependencies and source fields which contains the path to the file relative to the project root. This is primarily used to appropraitely configure a thebe session with the correct notebook path.

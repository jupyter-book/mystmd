---
'myst-cli': patch
---

`myst build` now exits with a non-zero exit code when a site build is requested but no site configuration is found, instead of silently succeeding without producing output.

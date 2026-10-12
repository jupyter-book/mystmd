---
'myst-parser': patch
'simple-validators': patch
'myst-frontmatter': patch
'myst-cli': patch
---

Add `key`s to "unexpected directive option" and "extra frontmatter key" warnings so they can be ignored selectively with `error_rules` (e.g. `code-cell.cell_style`, `jupytext.*`). Extra frontmatter keys now warn once per key.

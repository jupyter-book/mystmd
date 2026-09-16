---
'myst-to-typst': patch
---

Write equation and figure targets with `#label("..")` when their identifier is not a valid Typst name. A multi-word `:label:` option gives an identifier with spaces, which angle brackets cannot hold, so the document did not compile.

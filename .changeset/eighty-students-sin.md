---
'myst-directives': patch
'myst-transforms': patch
'myst-cli': patch
---

Changes processing of jupytext/myst style notebooks to ensure that `code-cell`s have a default output node associated with them and that any nested blocks containing a `code-cell` are lifted to the top level children of the root node.

This should ensure proper representation of the document as a notebook, and ensure that it can be treated the same as a noteobok that originated in an `ipynb` by web front ends.

Addresses:

- https://github.com/executablebooks/mystmd/pull/748
- https://github.com/executablebooks/mystmd/issues/816

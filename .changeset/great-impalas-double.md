---
'myst-transforms': patch
---

Lift equations out of paragraphs.

Generally displayed math is **not** inside of a paragraph, the exception is inside bullet lists and tables, or dollar-math that is created without new lines around it. Because these nodes are a div, they are rendered inside of a paragraph, which is not correct HTML. This throws exceptions in React, it works, but causes a client-side re-render, which flickers.

---
"markdown-it-myst": patch
"myst-parser": patch
---

Only trim end of line for myst-directives, not both the start and end of lines. This is important for keeping indentation in code blocks.

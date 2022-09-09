---
title: Document Model
description: jtex uses a standard document model to validate and expose frontmatter, as well as custom options that are template specific.
---

The document model is based on `frontmatter` but is modified to make it more useful for LaTeX templating.
For example, a date is not exposed as a `Date` object, instead it provides `day` `month` and `year` variables
that can be directly used in LaTeX without any translation.

```latex
\newdate{articleDate}{[-doc.date.day-]}{[-doc.date.month-]}{[-doc.date.year-]}
\date{\displaydate{articleDate}}
```

This is also completed with author and affiliation information, and the document model includes `index` and `letter`,
which help by making it easy to have, Author{sup}`a`, defined in LaTeX with `[- author.letter -]`.

---
title: Abbreviations
description: Define abbreviations in frontmatter and expand the first instance on each page.
---

Abbreviations can be written inline with the {myst:role}`abbr` role, or defined once in page or project frontmatter and applied throughout a document. See [](./glossaries-and-terms.md) for matching rules, longest-first ordering, and how to disable a string with `null`.

## Expand the first instance

By default, MyST wraps each match as an abbreviation so HTML can show the long form on hover. Printed pages and exports do not show that hover text, so the first use on a page can be expanded in place:

`TLA` becomes `Three Letter Acronym (TLA)`, and later uses stay `TLA`.

Set the reserved `firstTimeLong` flag in `abbreviations` on a page or in `myst.yml`:

```yaml
abbreviations:
  firstTimeLong: true
  TLA: Three Letter Acronym
  MyST: Markedly Structured Text
```

The flag is reserved and is not treated as an abbreviation string. Each distinct abbreviation is expanded once per page, including `{abbr}` role nodes that already have a title. Later instances keep the short form. Abbreviations inside links, cross-references, citations, and code are not rewritten.

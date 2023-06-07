---
title: Glossaries & Terms
---

To add a glossary to your content, add the `{glossary}` directive with the content as [definition lists](#definition-lists).

```markdown
:::{glossary}

MyST
: An amazing markup language that supports glossaries

:::

You can use {term}`MyST` to create glossaries.
```

The glossary can be in a different page, as long as it is parsed by your project. See an [example glossary](./glossary.md).

:::{warning} Compatibility with {term}`Sphinx`
The glossary is very similar to {term}`reStructuredText` glossary, but uses [definition lists](#definition-lists) instead of indentation to indicate the terms.

Note that this has a challenge of not being able to have two terms for the same definition.
:::

## Referencing a Term

To reference a term in a glossary use the `{term}` role:

- `` {term}`MyST` `` produces {term}`MyST`
- `` {term}`MyST Markdown <MyST>` `` produces {term}`MyST Markdown <MyST>`

The label that you use for the term should be in the same case/spacing as it appears in the glossary. If there is additional syntax (e.g. a link) in the term, the text only representation will be used. The term is rendered as a cross-reference to the glossary and will provide a hover-reference.

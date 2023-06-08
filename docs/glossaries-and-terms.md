---
title: Glossaries, Terms and Abbreviations
short_title: Glossaries & Terms
---

To add a glossary to your content, add the `{glossary}` directive with the content as [definition lists](#definition-lists).

```{myst}
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

(abbreviations)=

## Abbreviations

To create an abbreviation, you can explicitly do this in your document with an [abbreviation role](#abbr-role), for example, `` {abbr}`HR (Heart Rate)` ``. You can also use the page or project frontmatter:

```{myst}

---
abbreviations:
  RHR: Resting Heart Rate
  HR: Human Resources
---

To lower your RHR, try meditating or contact your local HR representative?
```

The abbreviations are case-sensitive and will replace all instances[^1] in your document with a hover-tooltip and accessibility improvements. Abbreviations in cross-references, code, and links are not replaced. For example, in this project we have a lot of abbreviations defined in our [`myst.yml`](./myst.yml):

[^1]: Abbreviations must be at least two characters!

> Our OA journal ensures your VoR is JATS XML with a PID (usually a DOI) to ensure LTS.
>
> - TLA Soup

:::{tip} Order of Abbreviations
:class: dropdown
The order of abbreviations in your frontmatter should specify the longer abbreviations first (e.g. `RHR`) and then the shorter abbreviations (e.g. `HR`). If you do this in the opposite order, you will have an abbreviation for R`HR`.
:::

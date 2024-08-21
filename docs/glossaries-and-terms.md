---
title: Glossaries, Terms, Index Pages, and Abbreviations
short_title: Glossaries, Terms, & Index Pages
---

You can define Terms and generate reference pages for them with Glossaries and Index Pages. This allows you to centralize definitions and pointers to where various items are mentioned throughout your documents.

:::{seealso} See our index and glossary page

- The [glossary for these docs](#glossary-page)
- The [index for these docs](#index-page)

:::

## Glossaries

Glossaries are a collection of definitions for Terms in your documents.
Below is the example of a glossary defining the terms {term}`glossary`, {term}`term`, and {term}`Index`

:::{glossary}
glossary
: A glossary is a [list of terms and their definitions](https://en.wikipedia.org/wiki/Glossary).

term
: A term is a [word with a specialized meaning](https://en.wikipedia.org/wiki/Terminology).

index
: An [organized list of information in a publication](<https://en.wikipedia.org/wiki/Index_(publishing)>).

index entry
: A word or phrase that has been marked for inclusion in the index with the `index` directive or role.
:::

To add a glossary to your content, add the {myst:directive}`glossary` directive with the content as [definition lists](#definition-lists).

```{myst}
:::{glossary}
MyST
: An amazing markup language that supports glossaries
:::

You can use {term}`MyST` to create glossaries.
```

You can define multiple glossaries in your documents, as long as they do not re-define the same term.

:::{warning} Compatibility with {term}`Sphinx` and {term}`reStructuredText`
:class: dropdown
The glossary is very similar to the [reStructuredText glossary](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#glossary), but uses [definition lists](#definition-lists) instead of indentation to indicate the terms[^drawback]. For working with glossaries in Sphinx, you can use the following syntax:

````markdown
```{glossary}
Term one
  An indented explanation of term 1

A second term
  An indented explanation of term 2
```
````

[^drawback]: Note that this has a challenge of not being able to have two terms for the same definition.

:::

## Terms

To reference a term in a glossary use the {myst:role}`term` role:

- `` {term}`MyST` `` produces {term}`MyST`
- `` {term}`MyST Markdown <MyST>` `` produces {term}`MyST Markdown <MyST>`

The label that you use for the term should be in the same case/spacing as it appears in the glossary. If there is additional syntax (e.g. a link) in the term, the text only representation will be used. The term is rendered as a cross-reference to the glossary and will provide a hover-reference.

## Index pages

Index pages show the location of various terms and phrases you define throughout your documentation.
They will show an alphabetized pointer to all {term}`Terms <term>` and {term}`Index entries <index entry>` that you define.

### Index entry directive

:::{warning}

The existing syntax for `index` directives and `index` roles has been taken directly from [Sphinx](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#index-generating-markup). An improved MyST-specific syntax will likely be added in the future, and this Sphinx syntax may be removed.
:::

You can define index entries with Directives like so:

```
:::{index} my first index item
:::
```

% This won't show up in the content
:::{index} my first index item
:::

In this case, no text will be displayed with the directive, but an index entry will be created in your index that points to the location of the directive.

You can define a nested index entry with a semicolon (`;`)

```
:::{index} index parent; index child
:::
```

% This won't show up in the content
:::{index} index parent; index child
:::

Also, you can define multiple, non-nested index entries in the directive argument by delimiting with a comma:

```
:::{index} index one, index two, index three
:::
```

#### Pairs and Triples

You can generate two reciprocal, nested index entries with `pair:`, like so:

```
:::{index}
pair: index one; index two
:::
```

or for three related items:

```
:::{index}
triple: index one; index two; index three
:::
```

You can define multiple index entries in a single directive by putting them on multiple lines. In this case each entry must have a prefix of (`single`, `pair`, or `triple` to distinguish what specific nested entries are created).

```
:::{index}
single: index one
single: index parent; index child
pair: index two; index three
pair: index four; index five
triple: index six; index seven; index eight
:::
```

#### See and See Also

For one index entry to reference another index entry, you may use the `see` or `seealso` prefix. For example,

```
:::{index}
see: index 1; index one
:::
```

This creates an entry like "_index 1_: See _index one_"

The prefix `seealso:` behaves identically but uses the text "See also" instead of "See."

#### Emphasis

To emphasize any index entry, add an exclamation point before the index term. This will style the entry as either bold or italic and move it before other entries that refer to the same term but are not emphasized.

```
:::{index} ! index one
:::
```

### Index entry role

You can define an index entry with a role like so: `` {index}`my second index` ``.
This includes the text "{index}`my second index`" in your content and creates an entry.

If you want the text to be different than the index entry, you may use the syntax `` {index}`text on the page <index term>` ``.

Index roles can use all the same prefixes as described for the `{index}` directive, including `single`, `pair`, `triple`, `see`, and `seealso`. For example, `` {index}`pair: index one; index two` `` or `` {index}`text on the page <pair: index one; index two>` ``.

### Generate an index

You can show an index on a MyST page with the `{show-index}` directive.
For example:

````
```{show-index}
```
````

See [the index for this documentation](#index-page) for what this generates.

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
Abbreviations defined in your frontmatter are applied in longest-sorted order. If you have two abbreviations with the same suffix (e.g. `RHR` and `HR`), the longer abbreviation will always take precedence.
To have the longer abbreviations not be transformed, explicitly set them to `null` in your frontmatter (e.g. `RHR: null`).
:::

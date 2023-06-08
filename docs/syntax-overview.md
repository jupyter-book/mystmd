---
title: MyST Syntax Overview
description: MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown.
---

MyST (Markedly Structured Text) is designed to create publication-quality documents written entirely in Markdown. The extensions and design of MyST is inspired by the [Sphinx](https://www.sphinx-doc.org/) and [reStructuredText](https://docutils.sourceforge.io/rst.html) (RST) ecosystems.

MyST is a superset of [CommonMark](./commonmark.md), the standard form of Markdown, and allows you to directly create “directives” and “roles” that extend markdown to support technical and scientific documents. `directives` are block-level extension points, like [callout panels](./admonitions.md), [tabs](./dropdowns-cards-and-tabs.md), [figures](./figures.md) or [embedded charts](./interactive-notebooks.ipynb); and roles are inline extension points, for components like [cross-references](./cross-references.md), [external references](./external-references.md), [citations](./citations.md), or [inline math](./math.md).

## Directives & Roles

Roles and directives are two of the most powerful parts of MyST. They are kind of like functions, but written in a markup language. They both serve a similar purpose, but roles are written in one line whereas directives span many lines. They both accept different kinds of inputs, and what they do with those inputs depends on the specific role or directive being used.

### Directives

Directives are multi-line containers that include an identifier, arguments, options, and content. Examples include [admonitions](./admonitions.md), [figures](./figures.md), and [equations](./math.md). At its simplest, you can use directives using a "fence" (either back-ticks or colons[^colon-or-fence]) and the name of the directive enclosed in braces (`{name}`):

[^colon-or-fence]: Which fence type, colon or backtick, is up to you, and either will work. The colon-fence has better fallback when the contents of the directive includes markdown in non-MyST renderers (like GitHub). The backtick-fence should be used when the contents of the directive is code-like (e.g. a diagram or math!).

(example-fence)=

``````{tab-set}
````{tab-item} Colon Fence
Use a colon fence (`:::`) when the contents of the directive is markdown, such as [callouts](./admonitions.md) or  [theorems](./proofs-and-theorems.md) this will improve the processing in renderers that do not support MyST:

```{myst}

:::{note}
Here is a note!
:::
```
````
`````{tab-item} Backtick Fence
Use a backtick fence (`` ``` ``) when the contents of the directive is code-like, such as [math](./math.md) or a [diagrams](./diagrams.md), this will ensure any sort of auto-formatting will not attempt to reformat these sections:
````{myst}
```{math}
\mathbf{u} \times \mathbf{v}=\left|\begin{array}{ll}u_{2} & u_{3} \\ v_{2} & v_{3}\end{array}\right| \mathbf{i}+\left|\begin{array}{ll}u_{3} & u_{1} \\ v_{3} & v_{1}\end{array}\right| \mathbf{j}+\left|\begin{array}{ll}u_{1} & u_{2} \\ v_{1} & v_{2}\end{array}\right| \mathbf{k}
```
````
`````
``````

The `{note}` directive above doesn't take any arguments and we didn't add any options. In addition to the directive name and the directive content, directives allow two other configuration points:

1\) **directive arguments** - a list of words that come just after the `{directivename}`.

``````{tab-set}
````{tab-item} Colon Fence
```markdown
:::{directivename} arg1 arg2
My directive content.
:::
```
````
`````{tab-item} Backtick Fence
````markdown
```{directivename} arg1 arg2
My directive content.
```
````
`````
``````

2\) **directive options** - a collection of flags or key/value pairs that come just underneath `{directivename}`.

There are two ways to write directive options, as `:key: value` or as a YAML block.

``````{tab-set}
`````{tab-item} Key value pairs
Options can be included as `:key: val` pairs, which is the default way to include options.
````markdown
```{directivename}
:key1: metadata1
:key2: metadata2

My directive content.
```
````
`````
`````{tab-item} YAML
Options can also be included as `key: val` pairs enclosed by `---` lines, similar to document frontmatter.
This is parsed as YAML, and may be easier for listing many options.


````markdown
```{directivename}
---
key1: metadata1
key2: metadata2
---

My directive content.
```
````
`````
``````

```{tip}
Specifying directive keywords with `:key:` or `---` will make no difference. Use the `:key: val` syntax as a shorthand for just one or two keywords. Use the `---` syntax if you have many keywords you wish to specify, or if some values will span multiple lines.
```

### Roles

Roles are very similar to directives, but they are written entirely in one line. The syntax of a role is:

```markdown
Some content {rolename}`and here is my role's content!`
```

Of course, roles will only work if `rolename` is a valid role name! The `abbr` role creates inline abbreviations, for example, `` {abbr}`MyST (Markedly Structured Text)` `` will become {abbr}`MyST (Markedly Structured Text)`! When you hover over[^1] the abbreviation you will see the `title` appear!

[^1]: Abbreviations are also great structured data for screen-readers!

Roles are defined inline, with an identifier and input. There are a number of roles included in MyST, including abbreviations, subscript, and superscript, as well as inline [](./math.md). Unknown roles will still be parsed as well:

```{myst}
Here is an {abc}`unknown role`.
```

(nesting-content)=

## Nesting content blocks in Markdown

If you’d like to nest content blocks inside one another in Markdown (for example, to put a `{note}` inside of a `{margin}`), you may do so by adding extra backticks (`` ` ``)[^colon] to the outer-most block.
For example, two [admonitions](./admonitions.md) nested in side of each other:

`````{myst}
````{important}
```{note}
Here's my `important`, highly nested note! 🪆
```
````
`````

[^colon]: You can also use this same technique and add colons to the initial directive or fence. See an [example](#example-fence) of when to use each syntax.

This works for literal code blocks as well. For example, to show triple-backticks on this page we are using following syntax:

`````{myst}
````
```
```
````
`````

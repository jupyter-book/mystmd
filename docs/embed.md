---
title: Embedding Content
description: You can embed labeled content (paragraphs, figures, notebook outputs, etc) across pages, allowing you to avoid re-writing the same information twice.
---

You can embed **labeled content** (paragraphs, figures, notebook outputs, etc) across pages, allowing you to avoid re-writing the same information twice.

::::{seealso} Creating a Label

Embedding content requires a label to be present.
To attach labels to blocks of content, see [](./cross-references.md).
To attach labels to Jupyter Notebook content, see [](./reuse-jupyter-outputs.md)

For the examples below, we are defining a figure with a label:

```markdown
:::{figure} https://source.unsplash.com/random/400x200?beach,ocean
:name: myLabel
Here's a cool figure.
:::
```

:::{figure} https://source.unsplash.com/random/400x200?beach,ocean
:name: myLabel
Here's a cool figure.
:::
::::

## The `{embed}` directive

The {myst:directive}`embed` directive can be used like so:

````myst
```{embed} #myLabel
```
````

```{embed} #myLabel

```

## The `![](#embed)` short-hand

The embedding markdown shorthand lets you quickly embed content using the Markdown image syntax (see more about [images](./figures.md)).
It can be used like so:

```markdown
![](#myLabel)
```

![](#myLabel)

## Embed notebook content

For instructions on how to embed notebook content, see [](./reuse-jupyter-outputs.md).

## `{embed}` vs. `{include}`

The {myst:directive}`include` directive is very similar to {myst:directive}`embed`, with a few key differences.

`{include}`
: parses source files (e.g. text files on your filesystem) and inserts them into the document structure as if you had written the content in your target source file.

`{embed}`
: Pulls any labelled MyST content or outputs already parsed in your project.

# Embedding content

You can embed **labeled content** (paragraphs, figures, notebook outputs, etc) across pages, allowing you to avoid re-writing the same information twice.

::::{seealso} How to create a label

Embedding content requires a label to be present.
To attach labels to blocks of content, see [](cross-references.md).
To attach labels to Jupyter Notebook content, see [](reuse-jupyter-content.md)

For the examples just below, we're defining a figure with a label like so:
% Not using the {myst} directive becuase it seems to not capture labels defined inside
```myst
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

The `{embed}` directive can be used like so:

````myst
```{embed} #myLabel
```
````

```{embed} #myLabel
```

## The `![](#embed)` short-hand

The embedding markdown shorthand lets you quickly embed content using the Markdown image syntax.
It can be used like so:

````myst
![](#myLabel)
````

![](#myLabel)

## Embed notebook content

For instructions on how to embed notebook content, see [](reuse-jupyter-content.md).

## `{embed}` vs. `{include}`

The `{include}` directive is very similar to `{embed}`, with a few key differences.

`{include}` parses source files (e.g. text files on your filesystem) and inserts them into the document structure **at the building phase** as if you had written the content in your target source file.

`{embed}` parses **MyST documents** (e.g., the `.json` data that is created when a MyST document is built) and inserts content **at the rendering phase**.

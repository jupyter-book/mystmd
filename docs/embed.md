---
title: Embed & Include Content
description: You can embed labeled content (paragraphs, figures, notebook outputs, etc) across pages, allowing you to avoid re-writing the same information twice.
---

You can [embed](#docs:embed) **labeled content** (paragraphs, figures, notebook outputs, etc) across pages, allowing you to avoid re-writing the same information twice. You can also [include files](#docs:include) that are not in your project.

::::{seealso} Creating a Label
Embedding content requires a label to be present.
To attach labels to blocks of content, see [](./cross-references.md).
To attach labels to Jupyter Notebook content, see [](./reuse-jupyter-outputs.md)

For the examples below, we are defining a figure with a label:

```markdown
:::{figure} https://github.com/rowanc1/pics/blob/main/mountains.png
:label: myLabel
Here's a cool figure.
:::
```

:::{figure} https://github.com/rowanc1/pics/blob/main/mountains.png
:label: myLabel
Here's a cool figure.
:::
::::

(docs:embed)=

## The {myst:directive}`embed` directive

The {myst:directive}`embed` directive allows you to insert snippets of content at the time a page is rendered.

See {myst:directive}`the {embed} directive documentation <embed>` for details about all the arguments you can give to `{embed}`.

The {myst:directive}`embed` directive can be used like so:

````myst
```{embed} #myLabel
```
````

```{embed} #myLabel

```

Note that this works for any labeled item in your MyST document, including from other pages.
For example, the following references the admonitions list in [](admonitions.md).

````
```{embed} #admonitions-list
```
````

```{embed} #admonitions-list

```

(embed-image-short-hand)=

### The `![](#embed)` short-hand

The embedding shorthand lets you embed content using the Markdown image syntax (see more about [images](./figures.md)).
This **removes the input cell** if you are [embedding from a Jupyter notebook](./reuse-jupyter-outputs.md).

It can be used like so:

```markdown
![](#myLabel)
```

![](#myLabel)

(embed-role)=

### The {myst:role}`embed` role

The {myst:role}`embed` role allows you to embed **content from labeled blocks** inline within your text, with control over whether to preserve markdown formatting or extract plain text only.

By default, the role preserves all markdown formatting including **bold**, *italic*, `` `inline code` ``, [links](url), inline math, and MyST roles like {sub}`subscript` and {sup}`superscript`.

#### Basic usage with markdown formatting (default)

For example, if you have a labeled paragraph with formatting:

```markdown
(my-text)=
This is **bold** and *italic* with `code` and [a link](https://example.com).
```

You can embed it with formatting preserved:

```markdown
The document states: {embed}`my-text`
```

Which renders as: "The document states: This is **bold** and *italic* with `code` and [a link](https://example.com)."

#### Plain text mode

If you need just the plain text without formatting, use the `format=text` option:

```markdown
{embed format=text}`my-text`
```

Which renders as: "This is bold and italic with code and a link."

#### Explicit markdown format

You can also explicitly specify markdown format (though this is the default):

```markdown
{embed format=markdown}`my-text`
```

#### Cross-file embedding

Like the {myst:directive}`embed` directive, {myst:role}`embed` supports cross-file references:

```markdown
{embed}`other-file.md#my-label`
{embed format=text}`other-file.md#my-label`
```

#### External MyST project embedding

You can also embed content from external MyST projects using the `xref:` or `myst:` prefixes (requires the project to be listed in your `references` configuration):

```markdown
{embed}`xref:project#label`
{embed format=text}`xref:project#label`
```

::::{seealso} Comparison with `{embed}` directive
The {myst:directive}`embed` directive embeds the full content as a block with all its styling (figures, admonitions, code blocks, etc.), while {myst:role}`embed` role extracts content for inline use.

**Use {myst:directive}`embed`** when you want to reuse a complete block of content with its styling.

**Use {myst:role}`embed`** when you need to reference content inline, with or without markdown formatting.

**Format options:**
- `format=markdown` (default): Preserves **bold**, *italic*, `code`, [links](url), math, and MyST roles
- `format=text`: Extracts plain text only
::::

### Embed images into figures

If you have a labeled image in your documentation, you can embed it as a Figure so that it contains figure metadata (like a caption, or adding alt-text).
To do so, use a **label attached to an image** instead of a filepath.

For example, we'll define an image with a label below:

```
(nice-sunset)=
![](https://github.com/rowanc1/pics/blob/main/sunset.png)
```

(nice-sunset)=
![](https://github.com/rowanc1/pics/blob/main/sunset.png)

And embed it into a figure next with a new `label`:

````
```{figure} #nice-sunset
:label: sunset-figure
Here's a nice sunset with a caption!
```
````

```{figure} #nice-sunset
:label: sunset-figure
Here's a nice sunset with a caption!
```

The new label can be referred to in this context, i.e. `[@sunset-figure]`: [@sunset-figure], which refers to the new figure rather than the original image. This allows you to scroll to embedded content on the page, rather than jumping to the original document. Note that this is especially useful with [embedding Jupyter Notebook outputs](./reuse-jupyter-outputs.md). For example:

```{figure} #img:altair-horsepower
This figure has been included from a Jupyter Notebook and can be referred to in cross-references through a different label. See [](./reuse-jupyter-outputs.md) for more information.
```

### Embed notebook content and outputs

You can embed notebook content (for example, images generated by running a cell).
For instructions on how to embed notebook content, see [](./reuse-jupyter-outputs.md).

### Embed from External MyST Projects

You can embed content from an **external site**, allowing you to re-use snippets of text, figures and tables, etc from other MyST projects. This is similar to [external cross-references](#myst-xref), which allow you to hover over a link and see the content on a different MyST site.

First, add `references` to your `myst.yml`:

:::{embed} #myst-xref-config
:::

You can then refer to content in these sites in two ways:

1. The [embed short hand](#embed-image-short-hand):

   ```md
   ![](xref:spec#admonition)
   ```

2. The {myst:directive}`Embed directive <embed>`:

   ```md
   :::{embed} xref:spec#admonition
   :::
   ```

When you build your MyST project, the content that your `#label` points to will be embedded in-place of the directive.

:::{prf:example} Embedding from the MyST Spec

The following content is embedded from `![](xref:spec#admonition)`:

![](xref:spec#admonition)

:::

(docs:include)=

## The {myst:directive}`include` directive

You can include multiple files into your MyST document as if they were all written in the same file.
This allows you to store content in separate files, and then weave them together at build time.
To do so, use the {myst:directive}`include` directive.

This is also helpful for including content snippets, such as a table or an equation, that you want to keep in a different file on disk, but present as if it were one document. In addition to Markdown, MyST will also parse `.ipynb`, `.tex`, and `.html`.

See {myst:directive}`the {include} directive documentation <include>` for details about all the arguments you can give to `{include}`.

:::{prf:example} Equation Bank
:label: eg:equation-bank
It is common practice to keep complex equations out of the main document so that they can be shared between slides, papers, and different renderings of a document. The `equations` folder in our documentation has a `curl.tex` file:

```{literalinclude} equations/curl.tex
:filename: equations/curl.tex
```

We can `include` that content in this document using:

````markdown
```{include} equations/curl.tex

```
````

which includes the content with the LaTeX parser:

```{include} equations/curl.tex

```

You will notice that there is no difference visually in the content, it is as if the content were include directly in line in the source document.
:::

:::{warning} Relative Paths in Markdown vs LaTeX
The {myst:directive}`argument <include.arg>` of the include directive is the file path and is **relative** to the file from which it was referenced. When working in markdown, recursive includes follow that same pattern. In LaTeX, however, recursive includes are relative to the original source file. This difference is only apparent when you have nested imports and a non-flat folder structure. MyST will also give you helpful warnings if it cannot find the file you are referencing.
:::

By default the file will be parsed using MyST, you can also set the file to be {myst:directive}`include.literal`, which will show as a code-block; this is the same as using the {myst:directive}`literalinclude` directive which is documented in [](#docs:literalinclude).

:::{note} Auto Reload & Circular Dependencies
:class: dropdown
If you are working with the auto-reload (e.g. `myst start`), the file dependencies are auto-reloaded.
Circular dependencies are not allowed and MyST will issue a warning and not render the recursion.
:::

:::{tip} Math and abbreviation frontmatter from included files
:class: dropdown
When including a file that has frontmatter, only some of that frontmatter is used. For example, the `math` macros and `abbreviations` are brought up to the top level and will overwrite any macros or abbreviations that already exist.

For LaTeX, the commands like `\newcommand` and `\renewcommand` are shared in the same way that math macros are shared for markdown files.
:::

## `{embed}` vs. `{include}`

The {myst:directive}`include` directive is very similar to {myst:directive}`embed`, with a few key differences.

`{include}` and `{literalinclude}`
: parses source files (e.g. text files on your filesystem) and inserts them into the document structure as if you had written the content in your target source file. These files are not listed in your project table of contents, and generally only contain snippets.

`{embed}`
: Pulls any labelled MyST content or outputs already parsed in your project.

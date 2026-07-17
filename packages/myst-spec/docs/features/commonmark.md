# CommonMark

This page provides an overview of the types of block and inline markup features supported by CommonMark and MyST, with pointers to additional content of interest. For full details on all the nuance of these features, please look at the [CommonMark Spec documentation](https://spec.commonmark.org/).

MyST (Markedly Structured Text) was designed to make it easier to create publishable computational documents written with Markdown notation. It is a superset of [CommonMark Markdown](https://commonmark.org/) and draws heavy inspiration from [RMarkdown](https://rmarkdown.rstudio.com/) syntax. In addition to CommonMark, MyST also implements and extends [mdast](https://github.com/syntax-tree/mdast), which is a standard abstract syntax tree for Markdown. `mdast` is part of the [unifiedjs](https://unifiedjs.com) community and has [many utilities](https://unifiedjs.com/explore/keyword/mdast/) for exporting and transforming your content.

## Block Markup

### Headings

```{include} ../nodes/heading.md

```

```{include} ../examples/heading.md

```

```{seealso}
Reference headings by preceding headers with a `(label)=`. See [](./references.md)!
```

### Lists

```{include} ../nodes/list.md

```

```{include} ../examples/list.md

```

### Code

```{include} ../nodes/code.md

```

```{include} ../examples/code.md

```

```{seealso}
Create code-blocks with additional highlighting using the `code-block` directive. See more here!
```

% TODO: provide a link!
% TODO: myst: implement code-block

### Blockquotes

```{include} ../nodes/blockquote.md

```

```{include} ../examples/blockquote.md

```

### Thematic Break

```{include} ../nodes/break.md

```

```{include} ../examples/break.md

```

```{seealso}
Thematic breaks should not be confused with MyST [block syntax](./blocks.md),
which is used to structurally seperate content.
```

### Link Definitions

```{include} ../nodes/definition.md

```

```{seealso}
These can be used in [](#inline-links) and are similar to [](./references.md) in MyST.
This syntax is also similar to [](./footnotes.md).
```

### Paragraph

```{include} ../nodes/paragraph.md

```

```{include} ../examples/paragraph.md

```

### Valid HTML

```{include} ../nodes/html.md

```

```{include} ../examples/html.md

```

## Inline Markup

(inline-links)=

### Inline links

```{include} ../nodes/link.md

```

```{include} ../examples/link.md

```

```{seealso}
[](./references.md) provides other ways to reference inline content.
```

### Inline images

```{include} ../nodes/image.md

```

```{include} ../examples/image.md

```

```{seealso}
[](./figures.md) provides other ways to size, label, and caption images.
```

### Text formatting

#### Emphasis

```{include} ../nodes/emphasis.md

```

#### Strong

```{include} ../nodes/strong.md

```

#### Inline Code

```{include} ../nodes/inlinecode.md

```

```{include} ../examples/formatting.md

```

```{seealso}
[](./basic.md) provides other roles for subscript, superscript, abbeviations, and other text formating.
```

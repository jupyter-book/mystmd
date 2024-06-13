---
title: CommonMark
description: MyST Markdown is a superset of CommonMark Markdown, and fully supports all of the markdown that you are used to. Here we describe all of the CommonMark features that are supported.
---

This page provides an overview of the types of block and inline markup features supported by CommonMark and MyST, with pointers to additional content of interest. For full details on all the nuance of these features, please look at the [CommonMark Spec documentation](https://spec.commonmark.org/).

MyST (Markedly Structured Text) was designed to make it easier to create publishable computational documents written with Markdown notation. It is a superset of [CommonMark Markdown](https://commonmark.org/) and draws heavy inspiration from <wiki:reStructuredText> and <wiki:pandoc>. In addition to CommonMark, MyST also implements and extends [unist](https://github.com/syntax-tree/unist) and [mdast](https://github.com/syntax-tree/mdast), which are standard abstract syntax trees for Markdown. `unist` is part of the [unifiedjs](https://unifiedjs.com) community and has [many utilities](https://unifiedjs.com/explore) for analyzing, exporting and transforming your content.

## Block Markup

### Headings

Markdown syntax denotes headers starting with between 1 to 6 `#`.
For example, a level 3 header looks like:

```{myst}
### Heading Level 3

Try changing the number of `#`s to change the `depth`.
```

(setex-headings)=

### Setext Headings

An alternative syntax (called setext) is also supported for level 1 and 2 headers,
by underlining using multiple `===` or `---`. For example:

```{myst}
Heading 1
=========

Heading 2
---------
```

```{seealso}
Reference headings by preceding headers with a `(label)=`. See [](./cross-references.md)!
```

### Lists

Bullet points:

```{myst}
- headings
- lists
  - bullets
  - numbers
- code blocks
```

Numbered items:

```{myst}
1. quotes
2. breaks
3. links
```

### Code

Code blocks are enclosed in 3 or more `` ` `` or `~` with an optional language name.

````{myst}
```python
print('this is python')
```
````

Indented paragraphs are also treated as literal text. This may be used for code or other preformatted text.

```{myst}
Some JSON:

    {
      'literal': '*text*'
    }
```

```{seealso}
Create code-blocks with additional highlighting using the `code-block` directive. See more here!
```

% TODO: provide a link!
% TODO: myst: implement code-block

### Quotes

Quote blocks are prepended with `>`:

```{myst}
> Super profound quote
```

### Thematic Break

Create a horizontal line in the output

```{myst}
Section 1

---

Section 2
```

```{seealso}
Thematic breaks should not be confused with MyST [block syntax](./blocks.md),
which is used to structurally separate content.
```

### Link Definitions

Links may be defined outside of text with a reference target (no spaces) and an optional title.

```{myst}
[This is a link defined elsewhere!][key]

[key]: https://www.google.com 'a title'
```

```{seealso}
These can be used in [](#inline-links) and are similar to [](./cross-references.md) in MyST.
This syntax is also similar to [](#footnotes).
```

### Paragraph

Any text that does not belong to another block is simply a paragraph:

```{myst}
any _text_
```

### Valid HTML

Any valid HTML may also be included in a MyST document and rendered to HTML. However, you must set the option `allowDangerousHtml: true` in the MyST parser.

## Inline Markup

(inline-links)=

### Inline links

Auto-link where link itself is shown in final output:

```{myst}
Search engine: <https://www.google.com>
```

Link with alternative text and optional title:

```{myst}
[search engine](https://www.google.com "Google")
```

```{seealso}
[](./cross-references.md) provides other ways to reference inline content.
```

(md:image)=

### Inline images

Link to an image can be done similar to other inline links, or you may use HTML syntax to include image size, etc.

```{myst}
![alt](https://github.com/rowanc1/pics/blob/main/apples.png?raw=true "title")
```

```{seealso}
[](./figures.md) provides other ways to size, label, and caption images.
```

### Text formatting

Standard inline formatting including bold, italic, code, as well as escaped symbols and line breaks:

```{myst}
**strong**, _emphasis_, `literal text`, \*escaped symbols\*, a hard\
break
```

```{seealso}
[](./typography.md) provides other roles for subscript, superscript, abbreviations, and other text formatting.
```

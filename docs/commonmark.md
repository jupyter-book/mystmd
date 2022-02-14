# CommonMark

MyST (Markedly Structured Text) was designed to make it easier to create publishable computational documents written with Markdown notation. It is a superset of [CommonMark Markdown](https://commonmark.org/) and draws heavy inspiration from [RMarkdown](https://rmarkdown.rstudio.com/) syntax. In addition to CommonMark, MyST also implements and extends [mdast](https://github.com/syntax-tree/mdast), which is a standard abstract syntax tree for Markdown. `mdast` is part of the [unifiedjs](https://unifiedjs.com) community and has [many utilities](https://unifiedjs.com/explore/keyword/mdast/) for exporting and transforming your content.

## Block Markup

### Headings

Markdown syntax denotes headers starting with between 1 to 6 `#`.
For example, a level 3 header looks like:

```{raw} html
<myst-demo>
### Heading Level 3

Try changing the number of `#`s to change the `depth`.
</myst-demo>
```

An alternative syntax is also supported for level 1 and 2 headers,
by underlining using multiple `===` or `---`. For example

```{raw} html
<myst-demo>
Heading 1
=========

Heading 2
---------
</myst-demo>
```

```{seealso}
You can reference headings by preceding your header with an `(id)=`. See more here!
% TODO: provide a link!
```

### Lists

- - List
  - bullet points or enumerated.
  - ```md
    - item
      - nested item

    1. numbered item
    ```

### Code

Enclosed in 3 or more `` ` `` or `~` with an optional language name.
See {ref}`syntax/code-blocks` for more information.

````{raw} html
<myst-demo>
```python
print('this is python')
```
</myst-demo>
````

```{seealso}
You can also create codeblocks with additional highlighting using the `code-block` directive. See more here!
% TODO: provide a link!
```

- - BlockCode
  - indented text (4 spaces or a tab)
  - ```md
        included as literal *text*
    ```

### Blockquotes

- - Quote
  - Quoted text
  - ```md
    > this is a quote
    ```

### Thematic Break

- - ThematicBreak
  - Creates a horizontal line in the output
  - ```md
    ---
    ```

### Link Definitions

- - LinkDefinition
  - A substitution for an inline link, which can have a reference target (no spaces), and an optional title (in `"`)
  - ```md
    [key]: https://www.google.com 'a title'
    ```

### Paragraph

- - Paragraph
  - General inline text
  - ```md
    any _text_
    ```

### Valid HTML

- - HTMLBlock
  - Any valid HTML (rendered in HTML output only)
  - ```html
    <p>some text</p>
    ```

## Inline Markup

### CommonMark inline tokens

````{list-table}
:header-rows: 1
:widths: 10 20 20

* - Token
  - Description
  - Example
* - HTMLSpan
  - Any valid HTML (rendered in HTML output only)
  - ```html
    <p>some text</p>
    ```
* - EscapeSequence
  - Escaped symbols (to avoid them being interpreted as other syntax elements)
  - ```md
    \*
    ```
* - AutoLink
  - Link that is shown in final output
  - ```md
    <http://www.google.com>
    ```
* - InlineCode
  - Literal text
  - ```md
    `a=1`
    ```
* - LineBreak
  - Soft or hard (ends with spaces or backslash)
  - ```md
    A hard break\
    ```
* - Image
  - Link to an image.
    You can also use HTML syntax, to include image size etc, [see here](syntax/images) for details
  - ```md
    ![alt](src "title")
    ```
* - Link
  - Reference `LinkDefinitions`. See {ref}`syntax/referencing` for more details.
  - ```md
    [text](target "title") or [text][key]
    ```
* - Strong
  - Bold text
  - ```md
    **strong**
    ```
* - Emphasis
  - Italic text
  - ```md
    *emphasis*
    ```
* - RawText
  - Any text
  - ```md
    any text
    ```
````

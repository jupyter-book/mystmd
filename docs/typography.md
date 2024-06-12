---
title: Typography
description: How to add everything from headers, inline code, to bold, italic and underline.
thumbnail: ./thumbnails/typography.png
---

## Headings

Markdown syntax denotes headers starting with between 1 to 6 `#`.
For example, a level 3 header looks like:

```{myst}
### Heading Level 3

Try changing the number of `#`s to change the `depth`.
```

An alternative syntax, {ref}`setex-headings`, is also supported for level 1 and 2 headers.

To reference a heading in your text, you can use the `(target)=` syntax, see [{name}](#targeting-headers) for more.

## Inline Text Formatting

Standard inline formatting including bold, italic, code, as well as escaped symbols and line breaks:

```{myst}
**strong**, _emphasis_, `literal text`, \*escaped symbols\*
```

strikethrough
: Use the `del` or `strike` role, for example, `` {del}`text` `` yields {del}`text`

underline
: Use the `u` or `underline` role, for example, `` {u}`text` `` yields {u}`text`
: Note, using this can often be confused with a link and usage of underlines [isn't recommended](https://practicaltypography.com/underlining.html), consider using strong or emphasis instead.

smallcaps
: Use the `sc` or `smallcaps` role, for example, `` {sc}`MyST` `` yields {sc}`MyST`

```{myst}
In {sc}`MyST`, you {del}`should never` {u}`underline` _text_.
```

## Line Breaks

To put a line break, without a paragraph, use a `\` followed by a new line. This corresponds to a `<br>` in HTML and `\\` in $\LaTeX$. For example, here is the [worlds shortest poem](wiki:Lines_on_the_Antiquity_of_Microbes):

```{myst}
Fleas \
Adam \
Had 'em.

By Strickland Gillilan
```

## Bullet points and numbered lists

You can use bullet points and numbered lists as you would in standard markdown. Starting a line with either a `-` or `*` for a bullet point, and `1.` for numbered lists. These lists can be nested using two spaces at the start of the line.

```{myst}
- Lists can start with `-` or `*`
  * My other, nested
  * bullet point list!

1. My numbered list
2. has two points
```

For numbered lists, you can start following lines with any number, meaning they don't have to be in numerical order, and this will not change the rendered output. The exception is the first number, which if it is not `1.` this will change the start number of the list.

## Task Lists

You can use GitHub Flavoured Markdown to create task lists, these may be read only or editable depending on the use case or the theme used.

```{myst}
- [x] Create a community around MyST
- [ ] Revolutionize technical communication
```

## Subscript & Superscript

For inline typography for subscript and superscript formatting, it is best practice to use a text-based representation over resorting to math exponents, i.e. `4$^{th}$`.
This is required in some journal submissions, and using these roles ensure that the output in HTML and $\LaTeX$ is correct.
The two roles for subscript and superscript are {myst:role}`sub` and {myst:role}`sup`[^long-names], respectively.

```{myst}
H{sub}`2`O, and 4{sup}`th` of July
```

[^long-names]: These two roles are also accessible through {myst:role}`subscript` and {myst:role}`superscript`.

% For chemicals you can use the {chem}`H2O`

(keyboard-input)=

## Keyboard Input

To denote textual _user_ input from a keyboard, such as {kbd}`Ctrl` + {kbd}`Space`, you can use the {myst:role}`kbd` role[^long-names-kbd].

[^long-names-kbd]: This role is also accessible through {myst:role}`keyboard`.

```{myst}
{kbd}`Ctrl` + {kbd}`Space`
```

(abbr-role)=

## Abbreviations

To create an abbreviation, you can use the {myst:role}`abbr` role, in HTML this will ensure that the title of the acronym or abbreviation appears in the title when you hover over the element. In the role, follow the syntax `HR (Heart Rate)` with the abbreviation first followed by the expanded title in parenthesis.

```{myst}
Well {abbr}`MyST (Markedly Structured Text)` is cool!
```

```{seealso} Abbreviations in Frontmatter
:class: dropdown

You can also set abbreviations in your page or project frontmatter to replace all instances of your abbreviation without writing the role every time!

See [](#abbreviations) for more information.
```

## Quotations

Quotations are controlled with standard Markdown syntax, by inserting a caret (`>`) symbol in front of one or more lines of text. You can provide an attribution to a blockquote by adding a final paragraph whose text starts with `--` or an em-dash (`—`), followed by the author or source. The blank `>` line is required!

```{myst}
> We know what we are, but know not what we may be.
>
> -- Hamlet act 4, Scene 5
```

The quotes can also be created using a directive (either {myst:directive}`blockquote` or {myst:directive}`epigraph`), which allows you to add classes or labels to the quote. MyST also supports {myst:directive}`pull-quote` directive, which act as attention-grabbing visual elements.

```{myst}
:::{pull-quote}
We know what we are, but know not what we may be.
:::

They say the owl was a baker’s daughter. Lord, we know what we are, but know not what we may be. God be at your table.
```

(definition-lists)=

## Definition Lists

Definition lists are based on the [Pandoc definition list specification](http://johnmacfarlane.net/pandoc/README.html#definition-lists), starting with the term followed by a colon on the next line. For example:

```{myst}
Term 1
: Definition

Term 2
: Definition
```

> Each term must fit on one line, which may optionally be followed by a blank line, and must be followed by one or more definitions. A definition begins with a colon or tilde, which may be indented one or two spaces.
>
> A term may have multiple definitions, and each definition may consist of one or more block elements (paragraphs, code blocks, lists, etc.)
>
> - [Pandoc documentation](https://pandoc.org/MANUAL.html#definition-lists)

````{tip}
:class: dropdown
# Complex Definition Lists

```{myst}
Term _with Markdown_
: Definition [with reference](content/definition-lists)

A second paragraph
: A second definition

Term 2
~ Definition 2a
~ Definition 2b

Term 3
: A code block
: > A quote
: A final definition, that can even include images:

  ![Sunset at the Beach!](https://github.com/rowanc1/pics/blob/main/sunset.png?raw=true)
```
````

(footnotes)=

## Footnotes

Footnotes use the [pandoc specification](https://pandoc.org/MANUAL.html#footnotes). A footnote is labeled with `[^label]` and can then be any alphanumeric string (no spaces), which is case-insensitive. This creates a link to the footnote definition, which is a line that starts with the same `[^label]: ` and then the text of the footnote.

```{myst}
- A footnote reference[^myref]
- Manually-numbered footnote reference[^3]

[^myref]: This is an auto-numbered footnote definition.
[^3]: This is a manually-numbered footnote definition.
```

If the label is an integer, then it will always use that integer for the rendered label (i.e. they are manually numbered). For any other labels, they will be auto-numbered in the order which they are referenced, skipping any manually numbered labels.

All footnote definitions are collected, and displayed at the bottom of the page for print or as hover-notes online.
Note that un-referenced footnote definitions will not be displayed.

Any preceding text after a footnote definitions, which is indented by four or more spaces, will also be included in the footnote definition.

````{tip}
:class: dropdown
# Complex Footnotes

```{myst}
That's exactly right[^1].

[^1]: Sometimes, you need to explain a point

    with some extra text!

    - and some *serious* points 💥
    - and even images!

    ![Mountains!](https://github.com/rowanc1/pics/blob/main/mountains.png?raw=true)

    Plus any preceding unindented lines,
that are not separated by a blank line

This is not part of the footnote!
```
````

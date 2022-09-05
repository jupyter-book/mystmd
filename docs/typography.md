---
title: Typography
description: How to add everything from headers, inline code, to bold, italic and underline.
---

## Headings

Markdown syntax denotes headers starting with between 1 to 6 `#`.
For example, a level 3 header looks like:

```{myst}
### Heading Level 3

Try changing the number of `#`s to change the `depth`.
```

An alternative syntax, {ref}`setex-headings`, is also supported for level 1 and 2 headers.

To reference a heading in your text, you can use the `(target)=` syntax, see {ref}`targeting-headers` for more.

## Inline Text Formatting

Standard inline formatting including bold, italic, code, as well as escaped symbols and line breaks:

```{myst}
**strong**, _emphasis_, `literal text`, \*escaped symbols\*
```

strikethrough
: Use the `del` or `strike` role, for example, `` {del}`text` `` yeilds {del}`text`

underline
: Use the `u` or `underline` role, for example, `` {u}`text` `` yeilds {u}`text`
: Note, using this can often be confused with a link and usage of underlines isn't recommended, consider using strong or emphasis instead.

smallcaps
: Use the `sc` or `smallcaps` role, for example, `` {sc}`MyST` `` yeilds {sc}`MyST`

## Line Breaks

To put a line break, without a paragraph, use a `\` followed by a new line. This corresponds to a `<br>` in HTML and `\\` in LaTeX. For example, here is the {wiki}`worlds shortest poem <Lines_on_the_Antiquity_of_Microbes>`:

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

### Subscript & Superscript

For inline typography for subscript and superscript formatting, it is best practice to use a text-based representation over resorting to math exponents, i.e. `4$^{th}$`.
This is required in some journal submissions, and using these roles ensure that the output in HTML and LaTeX is correct.
The two roles for subscript and superscript are `sub` and `sup`, respectively.

```{myst}
H{sub}`2`O, and 4{sup}`th` of July
```

```{note}
These two roles are also accessible through `subscript` and `superscript`.
```

% For chemicals you can use the {chem}`H2O`

## Abbreviations

To create an abbreviation, you can use the `abbr` role, in HTML this will ensure that the title of the acronym or abbreviation appears in the title when you hover over the element. In the role, follow the syntax `HR (Heart Rate)` with the abbreviation first followed by the expanded title in parenthesis.

```{myst}
Well {abbr}`MyST (Markedly Structured Text)` is cool!
```

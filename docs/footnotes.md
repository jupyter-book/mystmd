## Footnotes

Footnotes use the [pandoc specification](https://pandoc.org/MANUAL.html#footnotes). A foot note is labeled with `[^label]` and can then be any alpha-numeric string (no spaces), which is case-insensitive.

% TODO: figure out if we need to support the footnote numbering!?!

- If the label is an integer, then it will always use that integer for the rendered label (i.e. they are manually numbered).
- For any other labels, they will be auto-numbered in the order which they are referenced, skipping any manually numbered labels.

All footnote definitions are collected, and displayed at the bottom of the page (in the order they are referenced). Note that un-referenced footnote definitions will not be displayed.

```{myst}
- This is a manually-numbered footnote reference.[^3]
- This is an auto-numbered footnote reference.[^myref]

[^myref]: This is an auto-numbered footnote definition.
[^3]: This is a manually-numbered footnote definition.
```

Any preceding text after a footnote definitions, which is indented by four or more spaces, will also be included in the footnote definition, and the text is rendered as MyST, for example:

```{myst}
That's exactly right[^1].

[^1]: Sometimes, you need to explain a point

    with some extra text!

    - and some *serious* points 💥

    Plus any preceding unindented lines,
that are not separated by a blank line

This is not part of the footnote!
```

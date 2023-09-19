---
title: Code and code-blocks
description: Code and code-blocks can be used to show programming languages.
thumbnail: ./thumbnails/code.png
numbering:
  code: true
---

```{warning}
The code blocks on this page are for **presentation** of code only, they are not executed.

For code execution, see the `{code-cell}` directive in the execution section of the documentation.
```

You can include code in your documents using the standard markup syntax of ` ```language `,
where language is the programming language for highlighting.

````{myst}
```python
import matplotlib.pyplot as plt

plt.plot([1, 2, 3], [1, 2, 3], 'go-', label='line 1', linewidth=2)
```
````

```{note}
If the language is `ipython` or `IPython3`, etc., it will be dynamically converted to `python` to ensure that it is highlighted correctly!

A list of language names supported by the  `myst-react` package is here: [HLJS language identifier strings](https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_LANGUAGES_HLJS.MD)
```

## Code blocks

The above code is not a directive, it is just standard markdown syntax, which cannot add a caption or label. To caption or label blocks of code use the `code-block` directive.

````{myst}
```{code-block} python
:name: my-program
:caption: Creating a TensorMesh using SimPEG
from discretize import TensorMesh

hx = [(1, 40)]
hy = [(1, 40)]

mesh = TensorMesh([hx, hy])
```

In the [](#my-program), we create a mesh for simulation using [SimPEG](https://discretize.simpeg.xyz/).
````

## Numbering and Highlighting

To add numbers and emphasis to lines, we are following the [sphinx](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#directive-code-block) `code-block` directive. You can use `linenos` which is a flag, with no value, and `emphasize-lines` with a comma-separated list of line numbers to emphasize.

````{code-block} md
:linenos:
:emphasize-lines: 2,3
:caption: Emphasize lines inside of a `code` block.
```{code-block}
:linenos:
:emphasize-lines: 2,3
...
````

You can also set the start number using the `lineno-start` directive, and all emphasized lines will be relative to that number.

## `code-block` reference

linenos (no value)
: Show line numbers for the code block

lineno-start (number)
: Set the first line number of the code block. If present, `linenos` option is also automatically activated.
: Default line numbering starts at `1`.

emphasize-lines (string)
: Emphasize lines of the code block, for example, `1, 2` highlights the first and second lines.
: The line number counting starts at `lineno-start`, which is by default `1`.

caption (string)
: Add a caption to the code block.

name (string)
: The target label for the code-block, can be used by `ref` and `numref` roles.

```{note} Alternative implementations
:class: dropdown

The parser also supports the `docutils` implementation (see [docutils documentation](https://docutils.sourceforge.io/docs/ref/rst/directives.html#code)) of a `{code}` directive, which only supports the `number-lines` option.

It is recommended to use the more fully featured `code-block` directive documented above, or a simple markdown code block.

All implementations are resolved to the same `code` type in the abstract syntax tree.
```

## Including Files

If your code is in a separate file you can use the `literalinclude` directive (or the `include` directive with the `literal` flag).
This directive is helpful for showing code snippets without duplicating your content.

For example, a `literalinclude` of a snippet of the `myst.yml` such as:

````markdown
```{literalinclude} myst.yml
:start-at: project
:end-before: references
:lineno-match:
```
````

creates a snippet that has matching line numbers, and starts at a line including `"project"` and ends before the line including `"references"`.

```{literalinclude} myst.yml
:start-at: project
:end-before: references
:lineno-match:
```

:::{note} Auto Reload
If you are working with the auto-reload (e.g. `myst start`), currently you will need to save the file with the `literalinclude` directive for the contents to update.code for the contents to update.
:::

## `include` Reference

The argument of an include directive is the file path, relative to the file from which it was referenced.
By default the file will be parsed using MyST, you can also set the file to be `literal`, which will show as a code-block; this is the same as using the `literalinclude` directive.
If in literal mode, the directive also accepts all of the options from the `code-block` (e.g. `:linenos:`).

To select a portion of the file to be shown using the `start-at`/`start-after` selectors with the `end-before`/`end-at`, which use a snippet of included text.
Alternatively, you can explicitly select the lines (e.g. `1,3,5-10,20-`) or the `start-line`/`end-line` (which is zero based for compatibility with Sphinx).

literal (boolean)
: Flag the include block as literal, and show the contents as a code block. This can also be set automatically by setting the `language` or using the `literalinclude` directive.

lang (string)
: The language of the code to be highlighted as. If set, this automatically changes an `include` into a `literalinclude`.
: You can alias this as `language` or `code`

start-line (number)
: Only the content starting from this line will be included. The first line has index 0 and negative values count from the end.

start-at (string)
: Only the content after and including the first occurrence of the specified text in the external data file will be included.

start-after (string)
: Only the content after the first occurrence of the specified text in the external data file will be included.

end-line (number)
: Only the content up to (but excluding) this line will be included.

end-at (string)
: Only the content up to and including the first occurrence of the specified text in the external data file (but after any start-after text) will be included.

end-before (string)
: Only the content before the first occurrence of the specified text in the external data file (but after any start-after text) will be included.

lines (string)
: Specify exactly which lines to include from the original file, starting at 1. For example, `1,3,5-10,20-` includes the lines 1, 3, 5 to 10 and lines 20 to the last line of the original file.

lineno-match (boolean)
: Display the original line numbers, correct only when the selection consists of contiguous lines.

---
title: Code and code-blocks
description: Code and code-blocks can be used to show programming languages.
thumbnail: ./thumbnails/code.png
numbering:
  code: true
---

```{warning}
The code blocks on this page are for **presentation** of code only, they are not executed.

For code execution, see the {myst:directive}`code-cell` directive in the execution section of the documentation.
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

The above code is not a directive, it is just standard markdown syntax, which cannot add a {myst:directive}`code.caption` or {myst:directive}`code.label`. To caption or label blocks of code use the {myst:directive}`code` directive.

````{myst}
```{code} python
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

To add numbers and emphasis to lines use the {myst:directive}`code` directive. You can use {myst:directive}`code.linenos` which is a flag, with no value, and {myst:directive}`code.emphasize-lines` with a comma-separated list of line numbers to emphasize.

````{code} md
:linenos:
:emphasize-lines: 2,3
:caption: Emphasize lines inside of a `code` block.
```{code}
:linenos:
:emphasize-lines: 2,3
...
````

You can also set the start number using the {myst:directive}`code.lineno-start` directive, and all emphasized lines will be relative to that number.

```{tip} Docutils and Sphinx Compatibility
:class: dropdown

For full compatibility with Sphinx we suggest using `{code-block}` directive, which is an alias of the {myst:directive}`code` directive. The MyST implementation supports both the Sphinx [`{code-block} directive`](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#directive-code-block) as well as the `docutils` [{code} directive](https://docutils.sourceforge.io/docs/ref/rst/directives.html#code) implementation, which only supports the `number-lines` option.

You can use either `code` or `code-block` directive documented above or even a normal markdown code block.
All implementations in MyST are resolved to the same `code` type in the abstract syntax tree.
```

## Showing a Filename

Adding a {myst:directive}`code.filename` option will show the name of the file at the top of the code block. For example, `myst.yml` in the following example:

````{myst}
```{code} yaml
:filename: myst.yml
project:
  title: Showing Filenames in code-blocks
```
````

## Including Files

If your code is in a separate file you can use the {myst:directive}`literalinclude` directive (or the {myst:directive}`include` directive with the {myst:directive}`include.literal` flag).
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
If you are working with the auto-reload (e.g. `myst start`), currently you will need to save the file with the {myst:directive}`literalinclude` directive for the contents to update.code for the contents to update.
:::

The argument of an include directive is the file path ({myst:directive}`docs <include.arg>`), which is relative to the file from which it was referenced.
By default the file will be parsed using MyST, you can also set the file to be {myst:directive}`include.literal`, which will show as a code-block; this is the same as using the {myst:directive}`literalinclude` directive.

If in {myst:directive}`include.literal` mode, the directive also accepts all of the options from the `code-block` (e.g. {myst:directive}`include.linenos`).
To select a portion of the file to be shown using the {myst:directive}`include.start-at`/{myst:directive}`include.start-after` selectors with the {myst:directive}`include.end-before`/{myst:directive}`include.end-at`, which use a snippet of included text.

Alternatively, you can explicitly select the lines (e.g. `1,3,5-10,20-`) or the {myst:directive}`include.start-line`/{myst:directive}`include.end-line` (which is zero based for compatibility with Sphinx).

The include directive is based on [RST](https://docutils.sourceforge.io/docs/ref/rst/directives.html#including-an-external-document-fragment) and [Sphinx](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#directive-literalinclude).

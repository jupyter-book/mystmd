---
title: Code and code-blocks
description: Code and code-blocks can be used to show programming languages.
numbering:
  code: true
---

```{warning}
The code blocks on this page are for **presentation** of code only, they are not executed.

For code execution, see the `{code-cell}` directive in the execution section of the documentation.
```

You can include code in your documents using the standard markup syntax of ` ```language `,
where language is the programing language for highlighting.

````{myst}
```python
import matplotlib.pyplot as plt

plt.plot([1, 2, 3], [1, 2, 3], 'go-', label='line 1', linewidth=2)
```
````

```{note}
If the language is `ipython` or `IPython3`, etc., it will be dynamically converted to `python` to ensure that it is highlighted correctly!
```

## Code blocks

The above code is not a directive, it is just standard markdown syntax, which cannot add a caption or label. To caption or label blocks of code use the `code-block` directive.

````{myst}
---
numbering: | # This has to be a string for now, sillyness in the docutils clone
  code: true
---

```{code-block} python
:name: my-program
:caption: Creating a TensorMesh using SimPEG
from discretize import TensorMesh

hx = [(1, 40)]
hy = [(1, 40)]

mesh = discretize.TensorMesh([hx, hy])
```

In the {numref}`my-program`, we create a mesh for simulation using [SimPEG](https://discretize.simpeg.xyz/).
````

````{attention}
:class: dropdown
# How to turn on code `numbering`

For including the enumeration of programs, for example "Program 1" above, you need to turn numbering on in the document or project using `numbering` in the frontmatter:

```yaml
numbering:
  code: true
```
````

## Numbering and Highlighting

To add numbers and emphasis to lines, we are following the [sphinx](https://www.sphinx-doc.org/en/master/usage/restructuredtext/directives.html#directive-code-block) `code-block` directive. You can use `linenos` which is a flag, with no value, and `emphasize-lines` with a comma-seperated list of line numbers to emphasize.

````{code-block} md
:linenos:
:emphasize-lines: 2,3
:caption: Emphasize lines inside of a code block.
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

    ```{warning}
    :class: dropdown
    # Note: currently not parsed

    The current implementation does not parse the caption properly, and markup in this field will not be parsed.
    ```

name (string)
: The target label for the code-block, can be used by `ref` and `numref` roles.

```{note}
:class: dropdown
# Alternative implementations

The parser also supports the `docutils` implementation (see [docutils documentation](https://docutils.sourceforge.io/docs/ref/rst/directives.html#code)) of a `{code}` directive, which only supports the `number-lines` option.

It is recommended to use the more fully featured `code-block` directive documented above, or a simple markdown code block.

All implementations are resolved to the same `code` type in the abstract syntax tree.
```

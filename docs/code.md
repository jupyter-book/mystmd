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

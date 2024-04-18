# Code Cells and Inline Expressions with Markdown

You can specify Jupyter content in your markdown, which allows you to execute computation using [MyST's notebook execution engine](./execute-notebooks.md).

You can define two types of markdown-based computation:

- [**code cells**](#myst:code-cell): for block-level content
- [**in-line expressions**](#myst:inline-expressions): for content inline with surrounding text

```{code-cell} python
:tag: hide-cell
import matplotlib.pyplot as plt
import numpy as np
```

(myst:code-cell)=

## Code cells with the `{code-cell}` directive

You can use the {myst:directive}`code-cell` directive to create block-level computational outputs in MyST Markdown.

```{warning} This is an alpha feature
Markdown-based code cells are still in the works, and missing key functionality.
Their behavior is subject to change unpredictably!
```

`{code-cell}` directives have the following form:

````
```{code-cell} LANGUAGE
:key: value

CODE TO BE EXECUTED
```
````

- `LANGUAGE` defines the language to be used in executing the code.
- `:key: value` pairs will be treated as cell-level metadata.
- `CODE TO BE EXECUTED` will be executed by the `LANGUAGE` kernel at build time.

For example, the following directive inserts a code cell into the page, and will be executed if you specify `--execute` with your MyST build.

````markdown
```{code-cell} python
hello = "hello"
there = "there"
phrase = f"{hello}, {there}!"
print(phrase)
```
````

```{code-cell} python
hello = "hello"
there = "there"
phrase = f"{hello}, {there}!"
print(phrase)
```

### Add tags to `{code-cell}` directives

You can add tags to the `{code-cell}` directive.
They will be parsed and used in the same way that cell tag metadata is used in `.ipynb` files.

For example, the following code defines a `remove-input` tag:

````markdown
```{code-cell} python
:tags: remove-input
print("This will show output with no input!")
```
````

and results in the following:

> ```{code-cell} python
> :tags: remove-input
> print("This will show output with no input!")
> ```

This can be particularly helpful for showing the output of a calculation or plot, which is reproducible in the source code, but not shown to the user.

```{code-cell} python
:tags: remove-input
# Data for plotting
t = np.arange(0.0, 2.0, 0.01)
s = 1 + np.sin(2 * np.pi * t)

fig, ax = plt.subplots()
ax.plot(t, s)

ax.set(xlabel='time (s)', ylabel='voltage (mV)',
       title='Waves in Time')
ax.grid()

fig.savefig("test.png")
plt.show()
```

For **multiple tags** you have two ways to provide them:

- If you specify argument options with `:`, tags will be parsed as a comma-separated string.
  For example:

  ````markdown
  ```{code-cell} python
  :tags: tag1, tag2,tag3
  # Note that whitespace is removed from tags!
  print("howdy!")
  ```
  ````

- If you specify argument options with YAML, tags should be given as a YAML list.
  For example:

  ````markdown
  ```{code-cell} python
  ---
  tags:
  - tag1
  - tag2
  ---
  print("howdy!")
  ```
  ````

For more about how to specify directive options, see [](./syntax-overview.md).

:::{seealso} Controlling cell visibility with tags
See [](#notebooks:cell-visibility) for more information.
:::

(myst:inline-expressions)=

## Inline expressions with the `{eval}` role

You can use the `{eval}` role to evaluate code that is surrounded by text.
This allows you to quickly insert its output in a way that flows with the text around it.

For example, the following MyST Markdown would re-use the variable defined above.

```markdown
The phrase is: {eval}`phrase`.
```

This results in the following:

> The phrase is: {eval}`phrase`.

You can also modify the expression at the time of computation, for example:

```markdown
The phrase manually computed is: {eval}`f"{hello}, {there} everybody!"`
```

This results in the following:

> The phrase manually computed is: {eval}`f"{hello}, {there} everybody!"`

:::{seealso} Also works in JupyterLab
See [](./quickstart-jupyter-lab-myst.md) for how these eval statements also work in JupyterLab.
![](#fig:eval-array)
:::

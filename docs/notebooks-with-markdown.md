# Code Cells and Inline Expressions with Markdown

You can specify Jupyter content in your markdown, which allows you to execute computation using [MyST's notebook execution engine](./execute-notebooks.md).

You can define two types of markdown-based computation:

- [**code cells**](#myst:code-cell): for block-level content
- [**in-line expressions**](#myst:inline-expressions): for content inline with surrounding text

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
print("hi")
```
````

(myst:inline-expressions)=

## Inline expressions with the `{eval}` role

You can use the `{eval}` role to evaluate code that is surrounded by text.
This allows you to quickly insert its output in a way that flows with the text around it.

For example, the following MyST Markdown would re-use the variable defined above.

```markdown
The value of `hello` is {eval}`there`.
```

You can also modify the expression at the time of computation, for example:

```markdown
The value of `hello` is {eval}`there + ", wow that's nifty!"`.
```

:::{seealso} Also works in JupyterLab
See [](./quickstart-jupyter-lab-myst.md) for how these eval statements also work in JupyterLab.
![](#fig:eval-array)

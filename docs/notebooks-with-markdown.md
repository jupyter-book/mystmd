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

## Code cells with the {myst:directive}`code-cell` directive

You can use the {myst:directive}`code-cell` directive to create block-level computational outputs in MyST Markdown.

```{warning} This is an alpha feature
Markdown-based code cells are still in the works, and missing key functionality.
Their behavior is subject to change unpredictably!
```

{myst:directive}`code-cell` directives have the following form:

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

### Add tags to {myst:directive}`code-cell` directives

You can add tags to the {myst:directive}`code-cell` directive.
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

This can be particularly helpful for showing the output of a calculation or plot, which is reproducible in the {download}`source code <./notebooks-with-markdown.md>`, but not shown to the user like this `matplotlib` plot:

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

## Inline expressions with the {myst:role}`eval` role

You can use the {myst:role}`eval` role to evaluate code that is surrounded by text.
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

## Kernel specification

Kernel specification (kernel spec) tells the jupyter server how to start a kernel that executes your code.
When you call `myst build --execute` or `myst start --execute`, the MyST CLI starts a jupyter kernel to execute your code and gather its results.
Choosing different kernel specs in JupyterNotebook helps the user to flexibly switch the package environments and programming languages(for example, use R or Julia in the Notebook).
Similarly, we can also switch the kernel spec in MyST building.

### Setting in the frontmatter

You could explicitly choose the kernel spec in the **page-level**  frontmatter of the markdown file.
The following contents is a frontmatter sets the kernel spec to `python`:

```yaml
---
# ... other sections of the frontmatter
kernelspec:
  name: python3
  display_name: "Python 3"
---
```

When we declare the frontmatter, all the contents in {myst:directive}`code-cell` and {myst:role}`eval` will be executed by the `python` kernel during the building process.

Furthermore, you can build myst markdown content with other programming languages like JavaScript, R, and Julia by installing the corresponding kernel.
For example, to build a page that uses JavaScript in the {myst:directive}`code-cell`, we could:
1. Install the interactive JavaScript Kernel, like [ijavascript](https://github.com/n-riesco/ijavascript)
2. To check the installation and the kernel name, run `jupyter kernelspec list`. In the default installation, the kernel name is `javascript`.
3. Set the kernel spec in the frontmatter:
```yaml
---
# ... other sections of the frontmatter
kernelspec:
  name: javascript
  display_name: JavaScript
---
```

then the code cell like the following section will get the correct result and render.

````
```{code-cell} javascript
console.log("hello javascript kernel");
```
````

The full options of the kernel spec field supported is a subsect of [jupyter kernelspec](https://jupyter-client.readthedocs.io/en/latest/kernels.html#kernelspecs).
They are:

```yaml
kernelspec:
  name: python3 # required, the name of the kernel. can be found by `jupyter kernelspec list`
  display_name: "Python3 Kernel" # required, the display name of the kernel.
  language: python # optional, the language of the kernel, used for syntax highlight
  env: {} # optional, A dictionary of environment variables to set for the kernel
  argv: # optional, A list of command line arguments used to start the kernel
```

## Compatibility with jupytext

[jupytext](https://github.com/mwouts/jupytext) is a python package that makes some conventions to get the notebook-like experience in plain text documents.
It provides a JupyterBook extension to render those documents and an command tool to convert the plain text documents to the `.ipynb` notebook.
MyST is also supported by jupytext, and some of our users could use jupytext to write the draft MyST markdown files and do the conversion in different file formats.
The following command will convert the MyST markdown file to the `.ipynb` notebook, which could be helpful when you want to check the execution results and modify some code cells in the myst with a local jupyter notebook.

```shell
$ jupytext --from md:myst --to notebook <path_to_the_md_document>
```

### Kernel spec in jupytext

In myst CLI, it will do the auto-filling if there is the missing `name` or missing `display_name`.
But they are required by jupytext to do the rendering and conversion.
So we will raise a warning when the `name` or `display_name` is missing and suggest setting both `name` and `display_name` in the kernel spec.

### Cell Block breaking

The notebook converted by jupytext will only put cell partitions in code-cell and other markdown parts.
But in some common practice, it would be nice to separate long markdown contents into serval cell blocks.
As section [](./blocks.md) suggests, you could put `+++` in some proper positions in the file to get a better separated `.ipynb` notebook converted by jupytext.

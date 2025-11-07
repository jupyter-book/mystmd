---
title: Add metadata to notebooks
---

In addition to global controls that you can set in the [project
settings](#project-settings), you can also add metadata to individual notebooks,
or on notebook cells, to control how MyST handles them during execution and
rendering.

(notebook-tags)=

## Notebook tags

The concrete syntax of notebook tags depends on the notebook format.

(notebook-tags-ipynb)=

### ipynb notebooks

Using Jupyter Lab, you can use the `Property Inspector` builtin extension to manage notebook-level metadata.

:::{image} /images/jupyterlab-property-inspector.png
:::

Using this tool you can add key-value pairs to the notebook metadata. For
example, to skip execution of a notebook, you would add the following key-value
pair inside the notebook metadata dictionary:
```json
"tags": [
        "skip-execution"
    ]
```

### Markdown notebooks

With Markdown notebooks, you can add notebook-level metadata using the YAML frontmatter at the top of the file. For example, to skip execution of a notebook, you would add the following to the frontmatter:

```markdown
---
kernelspec:
  name: python3
  display_name: Python 3

skip_execution: true
---
```


(notebook-cell-tags)=

## Notebook cell tags

Tags are a list of strings under the `tags` key in the cell metadata, which can
be set in JupyterLab, VSCode or in a {myst:directive}`code-cell` directive. Here
again the actual syntax depends on the notebook format.

### ipynb notebooks

In the JSON representation of a jupyter notebook, cell tags would look like:

```json
{
  "cell_type": "code",
  "source": ["print('hello world')"],
  "metadata": {
    "tags": ["my-tag1", "my-tag2"]
  }
}
```

You can use the `Property Inspector` builtin extension in Jupyter Lab to manage cell metadata, like so:

:::{image} /images/jupyterlab-cell-tags.png
:::

### Markdown notebooks

In addition, [MyST also supports the {myst-directive}`code-cell` directive](notebooks-with-markdown.md#code-cell), and here's an example of adding the `raises-exception` tag on such a code cell:

In Markdown of a jupyter notebook these look like:

````markdown
```{code-cell} python
:tags: [remove-input]
print("This will show output with no input!")
```
````

for a single tag, or more generally, if you need to add multiple tags:

````markdown
```{code-cell} python
:tags: [my-tag1, my-tag2]
print("This will show output with no input!")
```
````

:::{table} Notebook cell tags with special meanings
:label: tbl:notebook-cell-tags

| Tag                | Description                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `remove-cell`      | Remove the cell from the rendered output.                                                                      |
| `remove-input`     | Remove the code cell input/source from the rendered output.                                                    |
| `remove-output`    | Remove the code cell output from the rendered output.                                                          |
| `hide-cell`        | Hides the cell from the rendered output.                                                                       |
| `hide-input`       | Hides the code cell input/source from the rendered output.                                                     |
| `hide-output`      | Hides the code cell output from the rendered output.                                                           |
| `remove-stderr`    | Remove the code cell output stderr from the rendered output. See also [project config](#setting:output_stderr) |
| `remove-stdout`    | Remove the code cell output stdout from the rendered output. See also [project config](#setting:output_stdout) |
| `skip-execution`   | Skip this cell, when executing the notebook                                                                    |
| `raises-exception` | Expect the code cell to raise an Exception (and continue execution)                                            |

:::

---
title: Notebook Configuration
---

As a convenience for users in Jupyter interfaces, some cell level configuration can be achieved by specifying tags in the cell metadata via tags

(notebook-cell-tags)=

### Notebook Cell Tags

Tags are a list of strings under the `tags` key in the cell metadata, which can be set in JupyterLab, VSCode or in a {myst:directive}`code-cell` directive.

In the JSON representation of a jupyter notebook these look like:

```json
{
  "cell_type": "code",
  "source": ["print('hello world')"],
  "metadata": {
    "tags": ["my-tag1", "my-tag2"]
  }
}
```

In Markdown of a jupyter notebook these look like:

````markdown
```{code-cell} python
:tags: remove-input
print("This will show output with no input!")
```
````

:::{table} Notebook cell tags with special meanings
:label: tbl:notebook-cell-tags

| Tag             | Description                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `remove-cell`   | Remove the cell from the rendered output.                                                                      |
| `remove-input`  | Remove the code cell input/source from the rendered output.                                                    |
| `remove-output` | Remove the code cell output from the rendered output.                                                          |
| `hide-cell`     | Hides the cell from the rendered output.                                                                       |
| `hide-input`    | Hides the code cell input/source from the rendered output.                                                     |
| `hide-output`   | Hides the code cell output from the rendered output.                                                           |
| `remove-stderr` | Remove the code cell output stderr from the rendered output. See also [project config](#setting:output_stderr) |
| `remove-stdout` | Remove the code cell output stdout from the rendered output. See also [project config](#setting:output_stdout) |

:::

:::{warning} Not Yet implemented

For code execution, these tags are provided:

| Tag                | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `skip-execution`   | Skip this cell, when executing the notebook                         |
| `raises-exception` | Expect the code cell to raise an Exception (and continue execution) |

:::

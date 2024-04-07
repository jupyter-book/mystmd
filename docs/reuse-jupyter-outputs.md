---
title: Embed and Reuse Jupyter Outputs
subtitle: Embedding outputs in narrative articles
short_title: Embed and Reuse Jupyter Outputs
description: Embed Jupyter Notebook outputs from any notebook into your website or article.
thumbnail: thumbnails/reuse-jupyter-outputs.png
---

You can embed notebook outputs across your MyST documentation.
To do so, first **attach a label** to a notebook cell's output, and then **use the [Embedding syntax for cross-references](embed.md)** to embed it elsewhere. By linking directly to the notebook you can improve the reproducibility of your technical work.

```{figure} ./images/reuse-jupyter-outputs.png
:name: reuse-jupyter-outputs
A scientific article with two figures created in Jupyter Notebooks. Each figure can be labeled directly in the notebook and reused in any other page directly.
```

(label-a-notebook-cell)=
## Label a Notebook Cell

You can label notebook cells in two ways:

**Use cell metadata comment syntax at the top of the cell**. Use a comment, followed by the pipe (`|`) operator at the top of a cell to set cell metadata.
For example, the following comment in a Python cell sets a label[^black]:

```{code-block} python
:linenos:
:emphasize-lines: 1,
:filename: myfile.ipynb, content of one cell
#| label: mycelllabel

# The comment above has special syntax and sets cell metadata.
# This allows us to embed "Hello world!" in other places.
print("Hello world!")
```

Note that `#` is the comment symbol for Python, but you'd use whatever symbol is used in the language for the notebook. 

**Add the label directly to the cell metadata**. Use a Jupyter interface or text editor to embed the label in the cell's metadata. For example, here's sample JSON that shows what metadata should look like:

```{code-block} json
:linenos:
:emphasize-lines: 5,
:filename: myfile.ipynb, metadata for one cell
{
    "trusted": true,
    "editable": true,
    "tags": [],
    "label": "my-other-cell-label"
}
```

[^black]: If your code formatter changes this to a `# | label:` with an extra space that is fine too! 🎉

## Cross Reference a Cell

Any labeled Jupyter cell can be referred to using the standard [cross-reference](./cross-references.md) syntax of markdown links.

```markdown
[](#my-cell) - This is a cross-reference to a notebook cell
```

The cross-referenced cell will be shown in a hover-preview and link to the notebook cell directly.
For example, [here we cross-reference a cell from the Jupyter Notebooks examples](#data-cars)

## Embed a cell output

Once a cell is labeled, you can embed its output with the standard [syntax for embedding content with MyST](embed.md).
For example, the following code embeds a labeled cell defined in [](interactive-notebooks.ipynb):

```md
![](#data-cars)
```

It results in the following:

![](#data-cars)

## Embed the entire cell with the `{embed}` directive

If you use the MyST short-hand for embedding (`![](#embed)` syntax), then **only the cell outputs** will be embedded.
If you'd like more control over the display of inputs and outputs, use the {myst:directive}`embed` directive.

For example, to embed **both the cell input and output**, use syntax like:

````
% Embed both the input and output
```{embed} #data-cars
:remove-output: false
:remove-input: false
```
````

% Embed both the input and output
```{embed} #data-cars
:remove-output: false
:remove-input: false
```

## Outputs as Figures

The labeled output can also be used in the `{figure}` directive, where you can then add a caption.
Below we give the figure a new `name` as well, so that we can cross-reference it directly.

```markdown
:::{figure} #my-cell
:name: fig-my-cell
:::
```

:::{note} Interactive Example

The following example embeds a figure from [](./interactive-notebooks.ipynb).

```{figure} #altair-horsepower
This figure has been included from [](./interactive-notebooks.ipynb) and can be referred to in cross-references through a different label.
```

:::

By default, the figure removes the code, to keep the code you can add `:remove-input: false` to your directive.

### Placeholder Content

It is possible that the Jupyter output may not work without computation, or you want to have a different figure in your static outputs. This is common if you are using interactive widgets, which only work when there is an active Jupyter kernel attached to the page. To create a placeholder image, add the option in the directive.

```markdown
:::{figure} #my-cell
:placeholder: ./image/static.png
:::
```

The placeholder will be used in static exports when the output cannot be directly serialized.

You may also define a placeholder image directly in a Jupyter notebook cell, in the same way you may [label the cell](#label-a-notebook-cell):

```python
#| label: my-cell
#| placeholder: hello.png
print('hello world')
```

In this case, the placeholder will replace _any_ output from the cell in static exports; outputs will only show up in interactive environments.

## Outputs as Tables

You can wrap tabular outputs (e.g. Pandas DataFrames) with a `{table}` directive in order to assign a caption and include it with your figures.
There are two ways to do this:

### The `{table}` directive

You can use a `{table}` directive and **embed** the notebook output inside the directive body.

For example:

````
:::{table} This is my table
:label: mytable
![](#data-cars)
:::
````

Results in:

:::{table} This is my table
:label: mytable
![](#data-cars)
:::

### Use the `{figure}` directive with `kind: table`

This defines a figure but allows the content to be a table.
For example, the following syntax:

````
:::{figure} #data-cars
:label: myothertable
:kind: table
This is my table caption!
:::
````

Results in:

:::{figure} #data-cars
:label: myothertable
:kind: table
This is my table caption!
:::

In either case, you can now reference the new table directly.

---
title: Reuse Jupyter Outputs
subtitle: Embedding outputs in narrative articles
short_title: Reuse Jupyter Outputs
description: Embed Jupyter Notebook outputs from any notebook into your website or article.
thumbnail: thumbnails/reuse-jupyter-outputs.png
---

Notebooks often hold computations that are useful to show in other articles. MyST allows you to add a label, and cross reference and/or embed these outputs directly in other articles. By linking directly to the notebook you can improve the reproducibility of your technical work.

```{figure} ./images/reuse-jupyter-outputs.png
:label: reuse-jupyter-outputs
A scientific article with two figures created in Jupyter Notebooks. Each figure can be labeled directly in the notebook and reused in any other page directly.
```

(label-a-notebook-cell)=
## Label a Notebook Cell

You can label notebook cells using a comment at the top of the cell, using a `#| label:` syntax[^black], or have this added directly in the notebook metadata for the cell.

```python
#| label: my-cell
print('hello world')
```

[^black]: If your code formatter changes this to a `# | label:` with an extra space that is fine too! 🎉

## Cross References

Any labeled Jupyter cell can be referred to using the standard [cross-reference](./cross-references.md) syntax of markdown links.

```markdown
[](#my-cell) - This is a cross-reference to a notebook cell
```

The cross-referenced cell will be shown in a hover-preview and link to the notebook cell directly.

## Outputs as Figures or Images

The labeled output can also be used in `figure` directive, where you can then add a caption. If you are referring to that figure in a further cross reference that figure (i.e. not the original cell), give it a new `name`.

```markdown
![](#my-cell) - This will embed the output of a notebook cell

or

:::{figure} #my-cell
:label: fig-my-cell
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

### Embed Directive

You can also use the {myst:directive}`embed` directive, which differs from the {myst:directive}`figure` as it does not have a caption and the default is to leave the code/input source.

````markdown
```{embed} #my-notebook-output
:remove-input: true
:remove-output: false
```
````

The embed directive can work with any other labeled content, allowing you to reuse snippets of your content throughout your project.

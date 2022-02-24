# Blocks

## Blocks

`Blocks` provide a structural divison of the MyST document. These correspond, for example, to separate cells in a Jupyter Notebook:

```{raw} html
<myst-demo>
+++ {"cell": "one"}
cell 1
+++ {"meta": "data!"}
cell 2
</myst-demo>
```

## Comments

```{raw} html
<myst-demo>
This next line render, but is in the HTML!
% Markdown comment line
</myst-demo>
```

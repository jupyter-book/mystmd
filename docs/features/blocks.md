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

You may add comments by putting the `%` character at the beginning of a line. This will prevent the line from being parsed into the output document.

```{raw} html
<myst-demo>
This next line won't render, but it is in the HTML!
% Markdown comment line
</myst-demo>
```

````{important}
Since comments are a block-level entity, they will terminate the previous block. In practical terms, this means that the following lines will be broken up into two paragraphs, resulting in a new line between them:

```
a line
% a comment
another line
```

a line
% a comment!
another line
````

---
title: Blocks and comments
description: Blocks provide structural divison in a MyST document using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. To add a comment, start your line with `%`.
---

## Blocks

`Blocks` provide a structural divison of the MyST document using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. There can be optional metadata associated with the block.

```{myst}
+++ {"cell": "one"}
cell 1
+++ {"meta": "data!"}
cell 2
```

## Comments

You may add comments by putting the `%` character at the beginning of a line. This will prevent the line from being parsed into the output document.

```{myst}
This next line won't render, but it is in the HTML!
% Markdown comment line
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

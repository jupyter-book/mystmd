---
title: Blocks and comments
description: Blocks provide structural divison in a MyST document using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. To add a comment, start your line with `%`.
---

## Blocks

`Blocks` provide a structural divison of MyST documents using `+++`. These correspond, for example, to separate cells in a Jupyter Notebook. There can be optional metadata associated with the block, such as "tags", "parts" or other identifiers.

```{myst}
+++ {"cell": "one"}
cell 1
+++ {"meta": "data!"}
cell 2
```

## Comments

You may add comments by putting the `%` character at the beginning of a line. This will prevent the line from being shown in the output document.

```{myst}
This next line won't render, but it is in the HTML!
% Markdown comment line
```

````{note}
# Comments split paragraphs.
Putting a comment between items will split any preceding elements. For example, a comment between two lines of text will be broken up into two paragraphs, resulting in a margin between them:

```{myst}
a line
% a comment
another line
```
````

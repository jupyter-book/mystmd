# Directives

MyST directives can add new functionality and extend existing commonmark features.

## Deviations mdast

- Tables are defined in the [mdast documentation](https://github.com/syntax-tree/mdast#table). We extend this spec by adding additional properties, including `align` and `header`. Notably, since we can specify `header` for each cell, we no longer have the assumption that the first row node of the table is the column labels. Also, cell `align` is specified at the cell level, rather than the table level, and the table `align` property refers to alignment of the table within the document, similar to images.

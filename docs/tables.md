# Tables

## Github Flavoured

Tables can be written using the standard [Github Flavoured Markdown syntax](https://github.github.com/gfm/#tables-extension-):

```{myst}
| foo | bar |
| --- | --- |
| baz | bim |
```

Cells in a column can be aligned using the `:` character:

```{myst}
| left | center | right |
| :--- | :----: | ----: |
| a    | b      | c     |
```

% TODO: The centering isn't working!?

## List Tables

````{myst}
```{list-table} This table title
:header-rows: 1
:name: example-table

* - Training
  - Validation
* - 0
  - 5
* - 13720
  - 2744
```
````

% TODO: Check that tables show a Table 1: at the start?

---
title: Tables
---

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

## Table directive

To add more features to your table, you can use the {myst:directive}`table` directive. Here you can add a caption and label. Adding a label enables [cross-referencing](cross-references.md) .

```{myst}
:::{table} Table caption
:label: table
:align: center

| foo | bar |
| --- | --- |
| baz | bim |

:::
```

```{note}
You may have inline markdown in the table caption, however, if it includes backticks, you must use a [colon fence](#example-fence).
```

## List Tables

The {myst:directive}`list-table` directive is used to create a table from data in a uniform two-level bullet list.
"Uniform" means that each sublist (second-level list) must contain the same number of list items.

````{myst}
```{list-table} This table title
:header-rows: 1
:label: example-table

* - Training
  - Validation
* - 0
  - 5
* - 13720
  - 2744
```
````

## CSV Tables

The {myst:directive}`csv-table` directive is used to create a table from comma-separated values (CSV) data.
Block markup and inline markup within cells is supported. Line ends are recognized within quoted cells.

````{myst}
```{csv-table} Frozen Delights!
:header: "Treat", "Quantity", "Description"

"Albatross", 2.99, "On a stick!"
"Crunchy Frog", 1.49, "If we took the bones out
it wouldn't be crunchy, now would it?"
"Gannet Ripple", 1.99, "On a stick!"
```
````

## <span style="background: -webkit-linear-gradient(20deg, #09009f, #E743D9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Complex Tables with Style</span>

It is also possible to write tables in raw HTML with `rowspan` and `colspan`, as well as for example:

```{myst}
:::{table} Area Comparisons (written in fancy HTML)
:label: tbl:areas-html

<table>
   <tr>
      <th rowspan="2">Projection</th>
      <th colspan="3" align="center">Area in square miles</th>
   </tr>
   <tr>
      <th align="right">Large Horizontal Area</th>
      <th align="right" style="background: -webkit-linear-gradient(20deg, #09009f, #E743D9); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Large Vertical Area</th>
      <th align="right">Smaller Square Area
      <th>
   </tr>
   <tr>
      <td>Albers Equal Area</td>
      <td align="right">7,498.7</td>
      <td align="right">10,847.3</td>
      <td align="right">35.8</td>
   </tr>
   <tr>
      <td>Web Mercator</td>
      <td align="right">13,410.0</td>
      <td align="right">18,271.4</td>
      <td align="right">63.0</td>
   </tr>
   <tr>
      <td>Difference</td>
      <td align="right" style="background-color: red;color: white">5,911.3</td>
      <td align="right">7,424.1</td>
      <td align="right">27.2</td>
   </tr>
   <tr>
      <td>
         <bold>Percent Difference</bold>
      </td>
      <td align="right" style="background-color: green;color: white">44%</td>
      <td align="right">41%</td>
      <td align="right">43%</td>
   </tr>
</table>
:::
```

:::{note} Styles are Only for HTML
CSS styles are currently only used for HTML outputs and are not carried through to all export targets (e.g. LaTeX) and are primarily used for web.
:::

## Include tables from file

If you have tables in a file (e.g. output from your data analysis elsewhere), you can use the {myst:directive}`include` directive. This works both for HTML and LaTeX tables ([`table-from-file.html`](table-from-file.html)).

````{card}
```myst
::::{table} Area Comparisons (imported HTML file)
:label: tbl:areas-html-file

:::{include} table-from-file.html
:::

::::
```

::::{table} Area Comparisons (imported HTML file)
:label: tbl:areas-html-file

:::{include} table-from-file.html
:::

::::
````

## Notebook outputs as tables

You can embed Jupyter Notebook outputs as tables.
See [](reuse-jupyter-outputs.md) for more information.

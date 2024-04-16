# Jupyter cells with Markdown files

You can specify Jupyter code cells in your markdown, which allows you to execute computation using [MyST's notebook execution engine](./execute-notebooks.md).

```{warning} This is a beta feature
Markdown-based code cells are still in the works, and missing key functionality.
Their behavior is subject to change unpredictably!
```

These use the {myst:directive}`code-cell` directive.
These have the following form:

````
```{code-cell} LANGUAGE
:key: value

CODE TO BE EXECUTED
```
````

- `LANGUAGE` defines the language to be used in executing the code.
- `:key: value` pairs will be treated as cell-level metadata.
- `CODE TO BE EXECUTED` will be executed by the `LANGUAGE` kernel at build time.

For example, the following directive inserts a code cell into the page, and will be executed if you specify `--execute` with your MyST build.

````markdown
```{code-cell} python
print("hi")
```
````

```{code-cell} python
print("hi")
```


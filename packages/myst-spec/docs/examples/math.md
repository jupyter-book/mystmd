``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
```{math}
:label: matrix
Ax = b
```
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: mystDirective
    name: math
    options:
      label: matrix
    value: Ax = b
    children:
      - type: math
        identifier: matrix
        label: matrix
        value: Ax = b

```
````

````{tab-item} Render
:sync: render

```{math}
:label: matrix
Ax = b
```

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
```{abc} foo bar
:a: one
:b: two

ABC directive
```
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: mystDirective
    name: abc
    args: foo bar
    value: |-
      :a: one
      :b: two

      ABC directive

```
````

````{tab-item} Render
:sync: render

```{abc} foo bar
:a: one
:b: two

ABC directive
```

````

``````


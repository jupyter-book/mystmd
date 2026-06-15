``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
{abc}`ABC role`
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: paragraph
    children:
      - type: mystRole
        name: abc
        value: ABC role

```
````

````{tab-item} Render
:sync: render

{abc}`ABC role`

````

``````


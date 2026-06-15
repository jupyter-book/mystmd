``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
This is genius {math}`e=mc^2`
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: paragraph
    children:
      - type: text
        value: 'This is genius '
      - type: mystRole
        name: math
        value: e=mc^2
        children:
          - type: inlineMath
            value: e=mc^2

```
````

````{tab-item} Render
:sync: render

This is genius {math}`e=mc^2`

````

``````


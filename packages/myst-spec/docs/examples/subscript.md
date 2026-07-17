``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
H{subscript}`2`O
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
        value: H
      - type: mystRole
        name: subscript
        value: '2'
        children:
          - type: subscript
            children:
              - type: text
                value: '2'
      - type: text
        value: O

```
````

````{tab-item} Render
:sync: render

H{subscript}`2`O

````

``````


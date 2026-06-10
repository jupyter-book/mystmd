``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
4{superscript}`th` of July
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
        value: '4'
      - type: mystRole
        name: superscript
        value: th
        children:
          - type: superscript
            children:
              - type: text
                value: th
      - type: text
        value: ' of July'

```
````

````{tab-item} Render
:sync: render

4{superscript}`th` of July

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
| header 1 | header 2 |
|:---|---:|
| 3 | 4 |
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: table
    children:
      - type: tableRow
        children:
          - type: tableCell
            header: true
            align: left
            children:
              - type: text
                value: header 1
          - type: tableCell
            header: true
            align: right
            children:
              - type: text
                value: header 2
      - type: tableRow
        children:
          - type: tableCell
            align: left
            children:
              - type: text
                value: '3'
          - type: tableCell
            align: right
            children:
              - type: text
                value: '4'

```
````

````{tab-item} Render
:sync: render

| header 1 | header 2 |
|:---|---:|
| 3 | 4 |

````

``````


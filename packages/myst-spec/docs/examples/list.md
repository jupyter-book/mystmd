``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
1. quotes
2. breaks
3. links
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: list
    ordered: true
    start: 1
    spread: false
    children:
      - type: listItem
        spread: true
        children:
          - type: text
            value: quotes
      - type: listItem
        spread: true
        children:
          - type: text
            value: breaks
      - type: listItem
        spread: true
        children:
          - type: text
            value: links

```
````

````{tab-item} Render
:sync: render

1. quotes
2. breaks
3. links

````

``````


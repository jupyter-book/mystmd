``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
```{figure} https://via.placeholder.com/150
This is the figure caption!

Something! A legend!?
```
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: mystDirective
    name: figure
    args: https://via.placeholder.com/150
    value: |-
      This is the figure caption!

      Something! A legend!?
    children:
      - type: container
        kind: figure
        children:
          - type: image
            url: https://via.placeholder.com/150
          - type: caption
            children:
              - type: paragraph
                children:
                  - type: text
                    value: This is the figure caption!
          - type: legend
            children:
              - type: paragraph
                children:
                  - type: text
                    value: Something! A legend!?

```
````

````{tab-item} Render
:sync: render

```{figure} https://via.placeholder.com/150
This is the figure caption!

Something! A legend!?
```

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
see {numref}`my-table`

```{list-table}  Caption text
:name: my-table

*   - Head 1
*   - Row 1
```
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
        value: 'see '
      - type: mystRole
        name: numref
        value: my-table
        children:
          - type: crossReference
            kind: numref
            identifier: my-table
            label: my-table
  - type: mystDirective
    name: list-table
    args: Caption text
    options:
      name: my-table
    value: |-
      *   - Head 1
      *   - Row 1
    children:
      - type: container
        kind: table
        identifier: my-table
        label: my-table
        children:
          - type: caption
            children:
              - type: paragraph
                children:
                  - type: text
                    value: Caption text
          - type: table
            children:
              - type: tableRow
                children:
                  - type: tableCell
                    children:
                      - type: text
                        value: Head 1
              - type: tableRow
                children:
                  - type: tableCell
                    children:
                      - type: text
                        value: Row 1

```
````

````{tab-item} Render
:sync: render

see {numref}`my-table`

```{list-table}  Caption text
:name: my-table

*   - Head 1
*   - Row 1
```

````

``````


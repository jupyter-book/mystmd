``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
Well {abbr}`CSS (Cascading Style Sheets)` is cool?
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
        value: 'Well '
      - type: mystRole
        name: abbr
        value: CSS (Cascading Style Sheets)
        children:
          - type: abbreviation
            title: Cascading Style Sheets
            children:
              - type: text
                value: CSS
      - type: text
        value: ' is cool?'

```
````

````{tab-item} Render
:sync: render

Well {abbr}`CSS (Cascading Style Sheets)` is cool?

````

``````


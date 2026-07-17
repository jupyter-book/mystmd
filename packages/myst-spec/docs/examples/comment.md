``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
Something
% A comment
Something else
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
        value: Something
  - type: mystComment
    value: A comment
  - type: paragraph
    children:
      - type: text
        value: Something else

```
````

````{tab-item} Render
:sync: render

Something
% A comment
Something else

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
(my_ID)=
# My Header
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: mystTarget
    label: my_ID
  - type: heading
    depth: 1
    children:
      - type: text
        value: My Header

```
````

````{tab-item} Render
:sync: render

(my_ID)=
# My Header

````

``````


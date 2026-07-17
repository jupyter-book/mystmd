``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
+++
# Heading!
+++
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: blockBreak
  - type: heading
    depth: 1
    children:
      - type: text
        value: Heading!
  - type: blockBreak

```
````

````{tab-item} Render
:sync: render

+++
# Heading!
+++

````

``````


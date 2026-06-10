``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
**strong**, _emphasis_, `literal text`, \*escaped symbols\*
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: paragraph
    children:
      - type: strong
        children:
          - type: text
            value: strong
      - type: text
        value: ', '
      - type: emphasis
        children:
          - type: text
            value: emphasis
      - type: text
        value: ', '
      - type: inlineCode
        value: literal text
      - type: text
        value: ', *escaped symbols*'

```
````

````{tab-item} Render
:sync: render

**strong**, _emphasis_, `literal text`, \*escaped symbols\*

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
```{admonition} This is a title
  An example of an admonition with a _title_.
```
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: mystDirective
    name: admonition
    args: This is a title
    value: An example of an admonition with a _title_.
    children:
      - type: admonition
        children:
          - type: admonitionTitle
            children:
              - type: text
                value: This is a title
          - type: paragraph
            children:
              - type: text
                value: 'An example of an admonition with a '
              - type: emphasis
                children:
                  - type: text
                    value: title
              - type: text
                value: .

```
````

````{tab-item} Render
:sync: render

```{admonition} This is a title
  An example of an admonition with a _title_.
```

````

``````


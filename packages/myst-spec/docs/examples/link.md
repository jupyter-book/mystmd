``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
[search engine](https://www.google.com "Google")
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: paragraph
    children:
      - type: link
        url: https://www.google.com
        title: Google
        children:
          - type: text
            value: search engine

```
````

````{tab-item} Render
:sync: render

[search engine](https://www.google.com "Google")

````

``````


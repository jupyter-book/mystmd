``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
<div><p>*some text*</p></div>
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: html
    value: <div><p>*some text*</p></div>

```
````

````{tab-item} Render
:sync: render

<div><p>*some text*</p></div>

````

``````


``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
thematic

---

break
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
        value: thematic
  - type: thematicBreak
  - type: paragraph
    children:
      - type: text
        value: break

```
````

````{tab-item} Render
:sync: render

thematic

---

break

````

``````


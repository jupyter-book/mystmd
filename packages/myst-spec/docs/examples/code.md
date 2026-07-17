``````{tab-set}
`````{tab-item} Markup
:sync: myst
````
```python
print('this is python')
```
````
`````

````{tab-item} AST
:sync: ast
```yaml
type: root
children:
  - type: code
    lang: python
    value: print('this is python')

```
````

````{tab-item} Render
:sync: render

```python
print('this is python')
```

````

``````


# Breaks

Breaks are used to divide a document. For simple visual breaks there are `hard breaks`:

```{raw} html
<myst-demo>
hard\
break
</myst-demo>
```

...and `thematic breaks`:

```{raw} html
<myst-demo>
thematic

---

break
</myst-demo>
```

`Block breaks` provide a structural divison of the MyST document. These correspond, for example, to separate cells in a Jupyter notebook:

```{raw} html
<myst-demo>
block
+++
break
</myst-demo>
```

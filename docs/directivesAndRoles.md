# Directives and Roles

Directives and roles define custom MyST behavior. Directives include an identifier, arguments, keyword arguments, and a text block. Examples include [](admonitions), [](figures), [](math) blocks. Unknown directives will be still be parsed as well:

````{raw} html
<myst-demo>
```{abc} arg0 arg1
:option: true

The "abc" directive is undefined.
```
</myst-demo>
````

Roles are defined inline, with an identifier and input. There are a number of [](roles), includeing abbreviations, subscript, and superscript, as well as inline [](math). Unknown roles will still be parsed as well:

```{raw} html
<myst-demo>
Here is an {abc}`unknown role`.
</myst-demo>
```

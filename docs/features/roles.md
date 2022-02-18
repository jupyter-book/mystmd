# Roles

Roles are defined inline, with an identifier and input. There are a number of [](roles), including abbreviations, subscript, and superscript, as well as inline [](math). Unknown roles will still be parsed as well:

```{raw} html
<myst-demo>
Here is an {abc}`unknown role`.
</myst-demo>
```

## Subscript / superscript

```{raw} html
<myst-demo>
H{subscript}`2`O
</myst-demo>
```

```{raw} html
<myst-demo>
4{superscript}`th` of July
</myst-demo>
```

## Abbreviations

```{raw} html
<myst-demo>
Well {abbr}`CSS (Cascading Style Sheets)` is cool?
</myst-demo>
```

```{raw} html
<myst-demo>
Well {abbr}`CSS` is cool?
</myst-demo>
```

## Math

```{raw} html
<myst-demo>
This is genius {math}`e=mc^2`
</myst-demo>
```

```{raw} html
<myst-demo>
Math is wrapped in `$` $e=mc^2$
</myst-demo>
```

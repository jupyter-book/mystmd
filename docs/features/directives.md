# Directives

Directives and roles define custom MyST behavior. Directives include an identifier, arguments, keyword arguments, and a text block. Examples include [](admonitions), [](figures), [](math) blocks. Unknown directives will be still be parsed as well:

````{raw} html
<myst-demo>
```{abc} arg0 arg1
:option: true

The "abc" directive is undefined.
```
</myst-demo>
````

# Admonitions

Let’s say you wish to highlight a particular block of text that exists slightly apart from the narrative of your page.
You can use the `{note}` directive for this. For example, try changing the following text:

````{raw} html
<myst-demo>
```{note}
Here is a note!
```
</myst-demo>
````

## Available admonitions

There is one general `{admonition}` directive available, and a number of pre-styled admonitions:

- `attention`
- `caution`
- `danger`
- `error`
- `important`
- `hint`
- `note`
- `seealso`
- `tip`
- `warning`

Try changing the directive type of the admonition below:

````{raw} html
<myst-demo>
```{tip}
Try changing `tip` to `warning`!
```
</myst-demo>
````

## Admonition Arguments

The base `{admonition}` has a single argument, which is the **title**, you can use markdown in here!

````{raw} html
<myst-demo>
```{admonition} Admonition *title*
Here is an admonition!
```
</myst-demo>
````

Note that all other admontions have no arguments, and as in other directives with no arguments content added in this spot will be added to the content body.

`````{danger}
All named admonitions (e.g. `{note}` or `{tip}`), have **no arguments**. Content on the first line will be appended to the admonition body.

Best practice is to put your body content on a new line.
````{raw} html
<myst-demo>
```{note} Notes require **no** arguments,
so content will be appended to the body.
```
</myst-demo>
````
`````

## Options

`:class:`
: CSS classes to add to your admonition, in addition to the default `admonition` class. The custom CSS class will be first.

For example, you can try adding the name of an admonition to apply those styles.
These classes in the default themes are lowercased without spaces (e.g. `seealso` or `error`).
You can also add your own class names, and they will be available in HTML.
To see an example, click the `HTML` tab in the below demo.

````{raw} html
<myst-demo>
```{admonition} My title
:class: tip
My custom admonition that has a `tip` class applied!
```
</myst-demo>
````

# Figures

# Math

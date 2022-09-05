---
title: Callouts (admonitions)
description: Callout blocks or admonitions, like "notes" or "hints" are outlined or shaded areas of a document to bring attention to particular information.
---

To highlight a particular block of text that exists slightly apart from the narrative of your page you can use a number of directive kinds like `{note}` or `{warning}`.

For example, try changing the following directive to a `{warning}`:

````{myst}
```{note}
Here is a note, try changing it to a `warning`!
```
````

The specification calls these kind of directives `admonition`, which are generally used through their named directives, like `{note}` or `{danger}`. Admonitions can have custom classes, icons and hide their children.

(admonitions-list)=

## Available admonitions

There is one general `{admonition}` directive available, and a number of pre-styled admonitions:

- `note`
- `important`
- `hint`
- `seealso`
- `tip`
- `attention`
- `caution`
- `warning`
- `danger`
- `error`

Try changing the directive type of the admonition below:

````{myst}
```{tip}
Try changing `tip` to `warning`!
```
````

See below for a demo of each admonition in the default theme.

`````{tab-set}

````{tab-item} Note
```{note}
This is an note admonition
```
````

````{tab-item} Important
```{important}
This is an important admonition
```
````

````{tab-item} Hint
```{hint}
This is an hint admonition
```
````

````{tab-item} See Also
```{seealso}
This is an seealso admonition
```
````

````{tab-item} Tip
```{tip}
This is an tip admonition
```
````

````{tab-item} Attention
```{attention}
This is an attention admonition
```
````

````{tab-item} Caution
```{caution}
This is an caution admonition
```
````

````{tab-item} Warning
```{warning}
This is an warning admonition
```
````

````{tab-item} Danger
```{danger}
This is an danger admonition
```
````

````{tab-item} Error
```{error}
This is an error admonition
```
````

`````

## Admonition arguments

The base `{admonition}` has a single argument, which is the **title**, you can use markdown in here!

````{myst}
```{admonition} Admonition *title*
Here is an admonition!
```
````

Note that all other admontions have no arguments, and as in other directives with no arguments content added in this spot will be prepended to the content body.

% TODO: This should be improved in MyST, even though it is a constraint of sphinx

`````{danger}
All named admonitions (e.g. `{note}` or `{tip}`), have **no arguments**. Content on the first line will be prepended to the admonition body.

Best practice is to put your body content on a new line. **This may change in future** to make it easier to create notes with custom titles.

````{myst}
```{note} Notes require **no** arguments,
so content will be appended to the body.
```
````
`````

## Options

**class**
: CSS classes to add to your admonition, in addition to the default `admonition` class. The custom CSS class will be first.

For example, you can try adding the name of an admonition to apply those styles.
These classes in the default themes are lowercased without spaces (e.g. `seealso` or `error`).
You can also add your own class names, and they will be available in HTML.
To see an example, click the `HTML` tab in the below demo.

````{myst}
```{admonition} My title
:class: tip
My custom admonition that has a `tip` class applied!
```
````

Note that if you provide conflicting class names, the first one in the {ref}`list above <admonitions-list>` will be used.

## Dropdown

You can also hide the body of your admonition blocks so that users must click the header to reveal the contents. This is helpful if you’d like to include some text that isn’t immediately visible to the user.

To turn an admonition into a dropdown, add the `dropdown` class to them.

````{myst}
```{note}
:class: dropdown
This is initially hidden!
```
````

You can use the `dropdown` class in conjunction with `{admonition}` directives to include your own titles and stylings. In the example below, we add both a `tip` and a `dropdown` class.

````{myst}
```{admonition} Click here!
:class: tip dropdown
This is initially hidden!
```
````

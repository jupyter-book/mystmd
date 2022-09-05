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

````{myst}
```{tip}
Try changing `tip` to `warning`!
```
````

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

TODO

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

## Dropdown

TODO

## Collapse

TODO

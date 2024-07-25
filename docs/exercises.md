---
title: Exercises and Solutions
short_title: Exercises
description: MyST supports adding exercises and solutions which can cross-reference each-other and include Jupyter Notebook outputs.
thumbnail: ./thumbnails/exercise.png
---

There are two directives available to add exercises and solutions to your documents: (1) an `exercise` directive; and (2) a `solution` directive. The exercises are enumerated by default and can take in an optional title argument as well as be "gated" around Jupyter Notebook cells.

:::{note} Same as Sphinx Exercise 🎉
:class: dropdown

The implementation and documentation for exercises and solutions is based on [Sphinx Exercise](https://ebp-sphinx-exercise.readthedocs.io), the syntax can be used interchangeably. We have reused the examples in that extension here to show off the various parts of the MyST extension.

Changes to the original extension include being able to click on the exercise label (e.g. "Exercise 1"), and having a link to that exercise anchor. We have also updated the styles from both Sphinx and Jupyter Book to be more distinct from admonitions.

You can also reference exercises with any cross-reference syntax (including the {myst:role}`ref` and {myst:role}`numref` roles). We recommend the markdown link syntax.
:::

## Exercise Directive

**Example**

```{exercise}
:label: my-exercise

Recall that $n!$ is read as "$n$ factorial" and defined as
$n! = n \times (n - 1) \times \cdots \times 2 \times 1$.

There are functions to compute this in various modules, but let's
write our own version as an exercise.

In particular, write a function `factorial` such that `factorial(n)` returns $n!$
for any positive integer $n$.
```

**MyST Syntax**

````markdown
```{exercise}
:label: my-exercise

Recall that $n!$ is read as "$n$ factorial" and defined as
$n! = n \times (n - 1) \times \cdots \times 2 \times 1$.

There are functions to compute this in various modules, but let's
write our own version as an exercise.

In particular, write a function `factorial` such that `factorial(n)` returns $n!$
for any positive integer $n$.
```
````

_Source:_ [QuantEcon](https://python-programming.quantecon.org/functions.html#Exercise-1)

The following options for exercise and solution directives are supported:

- `label`: text

  A unique identifier for your exercise that you can use to reference it with a Markdown link or {myst:role}`ref` and {myst:role}`numref` roles. Cannot contain spaces or special characters.

- `class`: text

  Value of the exercise’s class attribute which can be used to add custom CSS or JavaScript. This can also be the optional `dropdown` class to initially hide the exercise.

- `nonumber`: flag (empty)

  Turns off exercise auto numbering.

- `hidden` : flag (empty)

  Removes the directive from the final output.

## Solution Directive

A solution directive can be included using the `solution` pattern. It takes in the label of the directive it wants to link to as a required argument. Unlike the `exercise` directive, the solution directive is not enumerable as it inherits numbering directly from the linked exercise. The argument for a solution is the label of the linked exercise, which is required.

**Example**

````{solution} my-exercise
:label: my-solution

Here's one solution.

```{code-block} python
def factorial(n):
    k = 1
    for i in range(n):
        k = k * (i + 1)
    return k

factorial(4)
```
````

**MyST Syntax**

`````markdown
````{solution} my-exercise
:label: my-solution

Here's one solution.

```{code-block} python
def factorial(n):
    k = 1
    for i in range(n):
        k = k * (i + 1)
    return k

factorial(4)
```
````
`````

_Source:_ [QuantEcon](https://python-programming.quantecon.org/functions.html#Exercise-1)

The following options are also supported:

- `label` : text

  A unique identifier for your solution that you can use to reference it with `{ref}`. Cannot contain spaces or special characters.

- `class` : text

  Value of the solution’s class attribute which can be used to add custom CSS or JavaScript.

- `hidden` : flag (empty)

  Removes the directive from the final output.

## Referencing Exercises & Solutions

You can refer to an exercise using the standard link syntax:

- `[](#my-exercise)`, creates [](#my-exercise)
- `[{name}](#nfactorial)`[^note] creates [{name}](#nfactorial)
- `[{number}](#my-exercise)` creates [{number}](#my-exercise)
- `[See Exercise](#my-exercise)` creates [See Exercise](#my-exercise)

:::{tip} Compatibility with Sphinx Exercise
:class: dropdown

You can also refer to an exercise using the {myst:role}`ref` role like `` {ref}`my-exercise` ``, which will display the title of the exercise directive. In the event that directive does not have a title, the title will be the default "Exercise" or "Exercise {number}" like so: {ref}`my-exercise`.

Enumerable directives can also be referenced through the {myst:role}`numref` role like `` {numref}`my-exercise` ``, which will display the number of the exercise directive. Referencing the above directive will display {numref}`my-exercise`. In this case it displays the same result as the {myst:role}`ref` role as `exercise` notes are (by default) enumerated.

Furthermore, `numref` can take in three additional placeholders for more customized titles:

1. _%s_
2. _{number}_ which get replaced by the exercise number, and
3. _{name}_ by the exercise title.[^note]

For example,\
`` {numref}`My custom {number} and {name} <my-exercise-label>` ``.

[^note]: If the exercise directive does not have a title, the `label` will be used instead.

:::

### Referencing Solutions

You can refer to a solution directly as well using a Markdown link or using the {myst:role}`ref` role like: `` {ref}`my-solution` `` the output of which depends on the attributes of the linked directive. If the linked directive is enumerable, the role will replace the solution reference with the linked directive type and its appropriate number like so: {ref}`my-solution`.

In the event that the directive being referenced is unenumerable, the reference will display its title: {ref}`nfactorial-solution`.

:::{note} Named Exercise & Solution
:class: dropdown simple
:icon: false

```{exercise} $n!$ Factorial
:label: nfactorial
:nonumber:

Write a function `factorial` such that `factorial(int n)` returns $n!$
for any positive integer $n$.
```

````{solution} nfactorial
:label: nfactorial-solution

Here's a solution in Java.

```{code-block} java
static int factorial(int n){
    if (n == 0)
        return 1;
    else {
        return(n * factorial(n-1));
    }
}
````

:::

If the title of the linked directive being reference does not exist, it will default to {ref}`nfactorial-notitle-solution`.

:::{note} Unnumbered Exercise & Solution
:class: dropdown simple
:icon: false

```{exercise}
:label: nfactorial-notitle
:nonumber:

Write a function `factorial` such that `factorial(int n)` returns $n!$
for any positive integer $n$.
```

````{solution} nfactorial-notitle
:label: nfactorial-notitle-solution

Here's a solution in Java.

```{code-block} java
static int factorial(int n){
    if (n == 0)
        return 1;
    else {
        return(n * factorial(n-1));
    }
}
````

:::

## Alternative Gated Syntax

To be able to be viewed as Jupyter Notebooks (e.g. in [JupyterLab MyST](./quickstart-jupyter-lab-myst.md)) `code-cell` directives must be at the root level of the document for them to be executed. This maintains direct compatibility with the `jupyter notebook` and enables tools like `jupytext` to convert between `myst` and `ipynb` files.

As a result **executable** `code-cell` directives cannot be nested inside of exercises or solution directives.

The solution to this is to use the **gated syntax**.

```{note}
This syntax can also be a convenient way of surrounding blocks of text that may include other directives that you wish
to include in an exercise or solution admonition.
```

**Basic Syntax**

````markdown
```{exercise-start}
:label: ex1
```

```python
# Some code to explain the figure
```

and maybe you wish to add a figure

```{figure} https://github.com/rowanc1/pics/blob/main/beach.png

```

```{exercise-end}

```
````

```{exercise-start}
:label: ex1
```

```python
# Some setup code that needs executing
```

and maybe you wish to add a figure

```{figure} https://github.com/rowanc1/pics/blob/main/sunset.png

```

```{exercise-end}

```

This can also be completed for solutions with `solution-start` and `solution-end` directives. The `solution-start` and `exercise-start` directives have the same options as original directive.

```{warning} Mismatched Start & End
:class: dropdown
If there are missing `-start` and `-end` directives, this will cause an extension error,
alongside feedback to diagnose the issue in document structure.
```

## Hiding Directive Content

To visually hide the content, simply add `:class: dropdown` as a directive option, similar to an admonition.

**Example**

```{exercise}
:class: dropdown

Recall that $n!$ is read as "$n$ factorial" and defined as
$n! = n \times (n - 1) \times \cdots \times 2 \times 1$.

There are functions to compute this in various modules, but let's
write our own version as an exercise.

In particular, write a function `factorial` such that `factorial(n)` returns $n!$
for any positive integer $n$.
```

**MyST Syntax**:

````markdown
```{exercise}
:class: dropdown

Recall that $n!$ is read as "$n$ factorial" and defined as
$n! = n \times (n - 1) \times \cdots \times 2 \times 1$.

There are functions to compute this in various modules, but let's
write our own version as an exercise.

In particular, write a function `factorial` such that `factorial(n)` returns $n!$
for any positive integer $n$.
```
````

### Remove Directives

Any specific directive can be hidden by introducing the `:hidden:` option. For example, the following example will not be displayed

````markdown
```{exercise}
:hidden:

This is a hidden exercise directive.
```
````

```{exercise}
:hidden:

This is a hidden exercise directive.
```

% TODO: Remove All Solutions
% TODO: Custom CSS

---
title: Math and Equations
short_title: Math & Equations
description: Use LaTeX style math in your documents, including references, inline math, and equations.
thumbnail: ./thumbnails/math.png
---

There are several ways to make writing math in your documents as familiar as possible.
Math can either be (1) inline or (2) displayed as an equation block.
In addition to the usual MyST syntax, you can also use "dollar math", which is derived from $\LaTeX$
and surrounds inline math with single dollar signs (`$`), and equation blocks with two dollar signs (`$$`).
The details of using inline math and equations are below.

For example, here is an example of a cross-product, which we reference in the docs below!

$$
\mathbf{u} \times \mathbf{v}=\left|\begin{array}{ll}u_{2} & u_{3} \\ v_{2} & v_{3}\end{array}\right| \mathbf{i}+\left|\begin{array}{ll}u_{3} & u_{1} \\ v_{3} & v_{1}\end{array}\right| \mathbf{j}+\left|\begin{array}{ll}u_{1} & u_{2} \\ v_{1} & v_{2}\end{array}\right| \mathbf{k}
$$ (cross)

(inline-math)=
## Inline Math

There are two ways to write inline math; (1) with a `math` role or (2) by wrapping it in single dollar signs.

```{myst}
This math is a role, {math}`e=mc^2`, while this math is wrapped in dollar signs, $Ax=b$.
```

The output of these is the same (which you can see by looking at the AST and $\LaTeX$ outputs in the demo above).
Using a `math` role is much less likely to collide with your writing if it includes dollars (e.g. \$2.99).

Occasionally, dollar signs that you do not intend to wrap math need to be escaped.
These can be preceded by a backslash, that is `\$2.99`, and the `\` will not be displayed in your output.
If using $\LaTeX$ as an output, these dollar-signs will also be properly escaped again!

## Equations

There are three ways to create an equation block:
(1) a `math` directive (rather than a role for inline math);
(2) wrap the equation in two dollar-signs, `$$`; or
(3) use a `\begin{equation}` statement directly (i.e. using AMS math).

### Math directives

The math directive takes no arguments and the body of the directive is the $\LaTeX$ style math.
You can have an optional `label` parameter, which will label this equation for later cross-referencing, see [](#referencing-equations) below for more on that!

````{myst}
```{math}
:label: my-equation
w_{t+1} = (1 + r_{t+1}) s(w_t) + y_{t+1}
```

See [](#my-equation) for more information!
````

(dollar-math)=

### Dollar math equations

You can also create equations by wrapping content with two dollar signs (`$$`).
In this syntax, you can use the `\label{label-name}` command to add a label.
This can be quite convenient if your equations are small, the entire syntax can fit on a single line.

```{myst}
$$
\label{maxwell}
\begin{aligned}
\nabla \times \vec{e}+\frac{\partial \vec{b}}{\partial t}&=0 \\
\nabla \times \vec{h}-\vec{j}&=\vec{s}\_{e}
\end{aligned}
$$

$$ \label{one-liner} Ax=b $$

See [](#maxwell) for enlightenment and [](#one-liner) to do things on one line!
```


````{tip}
:class: dropdown
# Using AMS Math Environments

In addition to a `math` directive and dollar-math syntax, you can also use AMS math, which is specifically using [AMS Version 2.1](http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf).

```{myst}
\begin{equation}
\label{matrix}
Ax = b
\end{equation}

The general matrix equation is shown in [Equation %s](#matrix).
```

You can label your equation with the standard `\label{my-equation}` that you would do in $\LaTeX$.
The equation cross-referencing and numbering will work with the rest of your content.

```{warning}
The label implementation does not yet work for `sub-equations` and may not work if you have more than one label.
```

(ams-environments)=

## Supported AMS Environments

equation
: basic equation environment, similar to a math directive or dollar-math

multiline
: variation equation, used for equations that don’t fit on a single line

gather
: a group of consecutive equations when there is no alignment desired among them

align
: used for two or more equations when vertical alignment is desired
: Note that `aligned` (i.e. with the `ed`) is **not** an AMS environment and only works inside of `\begin{equation}` or a math environment.

alignat
: allows the horizontal space between equations to be explicitly specified.

flalign
: stretches the space between the equation columns to the maximum possible width

matrix, pmatrix, bmatrix, Bmatrix, vmatrix, Vmatrix
: The pmatrix, bmatrix, Bmatrix, vmatrix and Vmatrix have (respectively)
`()`,`[]`,`{}`,`||`,and `‖‖` delimiters built in.

eqnarray
: eqnarray is another supported math environment, it is not part of amsmath, and it is better to use
align or equation+split instead
````

(referencing-equations)=

## Referencing Equations

As you have seen above, any equation can be labelled and cross-referenced in other parts of your document.
For example, the start of this document had [Equation %s](#cross), which can be referenced here with a link and inline-preview.
There are a few different ways to reference equations, with more details in [](./cross-references.md).

### Labelling equations

The examples above all show how to label an equation in the interactive demos.
With a directive, you can use the `label` option;
with dollar-math and AMS math, you can use the `\label{}` syntax that is native to $\LaTeX$.

For example, a directive can be labelled as follows:

````md
```{math}
:label: my_label
my_math
```
````

To reference equations you can use a markdown link with the target, for example:\
`[](#cross)` will create: [](#cross)

`````{note}
:class: dropdown
# Coming from Sphinx? How to use `eq` and `numref` roles.

We recommend using markdown links, as the syntax is consistent across all references and citations. You can also have markup inside of the text link and dynamically insert enumeration. However, if you are familiar with roles in Sphinx, you can also use the `eq` and `numref` roles to cross-reference equations.

The `eq` role can be used for referencing math, and by default inserts the number in parenthesis,
for example, {eq}`cross`. The label should be the first and only entry in the body of the role.
The `numref` directive should be used if you want to refer to your equation with text or a non-standard format.
As with other references you can use the `%s` or `{number}` to fill in the equation number (see [](./cross-references.md)).
Note that `{name}` does not work for equations as there is no text content to fill in.

````{myst}
```{math}
:label: my_label
w_{t+1} = (1 + r_{t+1}) s(w_t) + y_{t+1}
```

- Reference using `eq`: {eq}`my_label`
- Reference using `numref`: {numref}`my_label`
- Reference using `%s` `numref`: {numref}`Eq. %s <my_label>`
- Reference using `{number}` in `numref`: {numref}`Equation {number} <my_label>`
````

```{warning}
If you are using JupyterBook or Sphinx, there are the following limitations:
(1) the `label` analysis of the source is not yet implemented;
(2) you can not reference equations using the {myst:role}`numref` role; and
(3) labels must not have spaces or start with a number (this is good practice anyways!).
```
`````

### Disabling Numbering

TODO!

### Customizing Numbering

To change the reference format, you can use the frontmatter under the `xxx` field.

TODO!

(math-macros)=

## Math Macros

Macros allow you to create reusable math components that can simplify the writing of a document.
These macros can be defined for a single document through the frontmatter, or shared in project frontmatter.
These macros are used throughout HTML and $\LaTeX$ exports and are written declaratively so that they can be easily parsed. Macros are the same as `\newcommand` or `\renewcommand` in $\LaTeX$, and use the `math` object in the frontmatter.

% Note: there must be a space here, or it is interpreted as {myst} options.
```{myst}

---
# Math frontmatter:
math:
  # Note the 'single quotes'
  '\dobs': '\mathbf{d}_\text{obs}'
  '\dpred': '\mathbf{d}_\text{pred}\left( #1 \right)'
  '\mref': '\mathbf{m}_\text{ref}'
---

The residual is the predicted data for the model, $\dpred{m}$, minus the observed data, $\dobs$. You can also calculate the predicted data for the reference model $\dpred{\mref}$.
```

The `math` macros are parsed as `yaml` in the frontmatter and can easily be shared or inherited through project to page frontmatter. These are also inserted into any $\LaTeX$ outputs for creating professional PDF documents.

```{important}
When using the YAML syntax for the `math` macros, use **single quotes** around the strings. The single quote yaml syntax means you do not have to text-escape the strings, otherwise backslashes `\f`, `\n`, `\b`, `\r`, `\t` and other symbols have to be escaped which is difficult to remember and leads to all sorts of strange errors.
```

The `key` is the command that you are defining, in the demo above `\dobs` or `\dpred`, the command should include the `\`. The value of the entry should be the macro definition, if the definition contains `#1` then there will be one required argument for the macro that should be supplied in braces when you use it (e.g. `\dpred{m}`). The macros can be nested as in the example where `\dobs{\mref}` uses two macros.

In the macro in the example above, `\mathbf{d}_\text{pred}\left( #1 \right)`, the `#1` is the first and only required argument, and is placed in between left and right brackets. The numbering for arguments starts at one, and other arguments can be added with `#2`, `#3`, etc. and then input in a command using `\command{arg1}{arg2}`.

```{seealso}
In the future the information collected in the math macro will expand to include alt text, color, or interaction information (e.g. hover, substitution) to improve accessibility and interactivity.
```

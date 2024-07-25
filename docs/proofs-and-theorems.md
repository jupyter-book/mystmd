---
title: Proofs, Theorems and Algorithms
short_title: Proofs & Theorems
description: MyST supports creating and referencing algorithms, axioms, conjectures, corollaries, criteria, definitions, examples, lemmas, observations, properties, propositions, proofs, remarks, and theorems.
thumbnail: ./thumbnails/proof.png
---

All proof directives can be included using the `prf:kind` pattern, where the proof directives are shown in [](#proof-list). The directive is enumerated by default and can take in an optional title argument which is shown in brackets after the proof.

:::{note} Same as Sphinx Proof 🎉
:class: dropdown

The implementation and documentation for proofs, theorems, etc. is based on [Sphinx Proof](https://github.com/executablebooks/sphinx-proof), the syntax can be used interchangeably. We have reused the examples in that extension here to show off the various parts of the MyST extension.

Changes to the original extension include being able to click on the proof label (e.g. "Theorem 1"), and having a link to that proof anchor. We have also updated the styles from both Sphinx and Jupyter Book to be more distinct from admonitions.

You can also reference proofs with any cross-reference syntax (including the {myst:role}`prf:ref` role). We recommend the markdown link syntax.
:::

Here is an example of a `{prf:theorem}` with a custom title:

:::{prf:theorem} Orthogonal-Projection-Theorem
:label: my-theorem

Given $y \in \mathbb R^n$ and linear subspace $S \subset \mathbb R^n$,
there exists a unique solution to the minimization problem

```{math}
\hat y := \argmin_{z \in S} \|y - z\|
```

The minimizer $\hat y$ is the unique vector in $\mathbb R^n$ that satisfies

- $\hat y \in S$

- $y - \hat y \perp S$

The vector $\hat y$ is called the **orthogonal projection** of $y$ onto $S$.
:::

```{list-table} Proof kinds that can be used as directives
:label: proof-list
:header-rows: 0

* - `prf:algorithm`
  - `prf:axiom`
  - `prf:conjecture`
* - `prf:corollary`
  - `prf:criteria`
  - `prf:definition`
* - `prf:example`
  - `prf:lemma`
  - `prf:observation`
* - `prf:property`
  - `prf:proposition`
  - `prf:proof`
* - `prf:remark`
  - `prf:theorem`
  -
```

The following options for proof directives are supported:

- `label`: text

  A unique identifier for your theorem that you can use to reference it with a Markdown link or the {myst:role}`prf:ref` role. Cannot contain spaces or special characters.

- `class`: text

  Value of the theorem’s class attribute which can be used to add custom CSS or JavaScript. This can also be the optional `dropdown` class to initially hide the proof.

- `nonumber`: flag (empty)

  Turns off auto numbering.

## Referencing Proofs

You can refer to a proof using the standard link syntax:

- `[](#my-theorem)`, creates [](#my-theorem)
- `[{name}](#my-theorem)` creates [{name}](#my-theorem)
- `[{number}](#my-theorem)` creates [{number}](#my-theorem)
- `[See Theorem](#my-theorem)` creates [See Theorem](#my-theorem)

:::{tip} Compatibility with Sphinx Proof
:class: dropdown

You may also use the the `{prf:ref}` role like: `` {prf:ref}`my-theorem` ``, which will replace the reference with the theorem number like so: {prf:ref}`my-theorem`. When an explicit text is provided, this caption will serve as the title of the reference. For example, ``{prf:ref}`Orthogonal-Projection-Theorem <my-theorem>` `` will produce: {prf:ref}`Orthogonal-Projection-Theorem <my-theorem>`.
:::

## Hiding Proof Content

To hide the directive, simply add `:class: dropdown` as a directive option.

**Example**

```{myst}
:::{prf:theorem}
:class: dropdown

This is an example of how to hide the content of a directive.
:::
```

## Proof Examples

### Proofs

````{myst}
:::{prf:proof}
:label: full-proof
Let $z$ be any other point in $S$ and use the fact that $S$ is a linear subspace to deduce

```{math}
\| y - z \|^2
= \| (y - \hat y) + (\hat y - z) \|^2
= \| y - \hat y \|^2  + \| \hat y - z  \|^2
```

Hence $\| y - z \| \geq \| y - \hat y \|$, which completes the proof.
:::
````

_Source:_ Adapted from [QuantEcon](https://python-advanced.quantecon.org/orth_proj.html#The-Orthogonal-Projection-Theorem)

### Theorems

````{myst}
:::{prf:theorem} Orthogonal-Projection-Theorem
:label: my-theorem

Given $y \in \mathbb R^n$ and linear subspace $S \subset \mathbb R^n$,
there exists a unique solution to the minimization problem

```{math}
\hat y := \argmin_{z \in S} \|y - z\|
```

The minimizer $\hat y$ is the unique vector in $\mathbb R^n$ that satisfies

* $\hat y \in S$

* $y - \hat y \perp S$


The vector $\hat y$ is called the **orthogonal projection** of $y$ onto $S$.
:::
````

_Source:_ [QuantEcon](https://python-advanced.quantecon.org/orth_proj.html#The-Orthogonal-Projection-Theorem)

### Axioms

```{myst}
:::{prf:axiom} Completeness of $\mathbb{R}$
:label: my-axiom

Every Cauchy sequence on the real line is convergent.
:::
```

_Source:_ {cite}`economic-dynamics-book`

### Lemmas

````{myst}
:::{prf:lemma}
:label: my-lemma

If $\hat P$ is the fixed point of the map $\mathcal B \circ \mathcal D$ and $\hat F$ is the robust policy as given in [(7)](https://python-advanced.quantecon.org/robustness.html#equation-rb-oc-ih), then

```{math}
:label: rb_kft

K(\hat F, \theta) = (\theta I - C'\hat P C)^{-1} C' \hat P  (A - B \hat F)
```
:::
````

_Source:_ [QuantEcon](https://python-advanced.quantecon.org/robustness.html#Appendix)

### Definitions

```{myst}
:::{prf:definition}
:label: my-definition

The *economical expansion problem* (EEP) for
$(A,B)$ is to find a semi-positive $n$-vector $p>0$
and a number $\beta\in\mathbb{R}$, such that

$$
\begin{align*}
&\min_{\beta} \hspace{2mm} \beta \\
&\text{s.t. }\hspace{2mm}Bp \leq \beta Ap
\end{align*}
$$
:::
```

_Source:_ [QuantEcon](https://python-advanced.quantecon.org)

### Criteria

````{myst}
:::{prf:criterion} Weyl's criterion
:label: weyls-criterion

Weyl's criterion states that the sequence $a_n$ is equidistributed modulo $1$ if
and only if for all non-zero integers $m$,

```{math}
\lim_{n \rightarrow \infty} \frac{1}{n} \sum_{j=1}^{n} \exp^{2 \pi i m a_j} = 0
```
:::
````

_Source:_ [Wikipedia](https://en.wikipedia.org/wiki/Equidistributed_sequence#Weyl's_criterion)

### Remarks

```{myst}
:::{prf:remark}
:label: my-remark

More generally there is a class of density functions
that possesses this feature, i.e.

$$
\exists g: \mathbb{R}_+ \mapsto \mathbb{R}_+ \ \ \text{ and } \ \ c \geq 0,
\ \ \text{s.t.  the density } \ \ f \ \ \text{of} \ \ Z  \ \
\text{ has the form } \quad f(z) = c g(z\cdot z)
$$

This property is called **spherical symmetry** (see p 81. in Leamer (1978))
:::
```

_Source:_ [QuantEcon](https://python-advanced.quantecon.org/black_litterman.html)

### Conjectures

```{myst}
:::{prf:conjecture} Fake $\gamma$ conjecture
:label: my-conjecture
This is a dummy conjecture to illustrate that one can use math in titles.
:::
```

### Corollaries

```{myst}
:::{prf:corollary}
:label: my-corollary

If $A$ is a convergent matrix, then there exists a matrix norm such
that $\vert \vert A \vert \vert < 1$.
:::
```

_Source:_ [QuantEcon](https://python-intro.quantecon.org/_static/lecture_specific/linear_models/iteration_notes.pdf)

### Algorithms

```{myst}
:::{prf:algorithm} Ford–Fulkerson
:label: my-algorithm

**Inputs** Given a Network $G=(V,E)$ with flow capacity $c$, a source node $s$, and a sink node $t$

**Output** Compute a flow $f$ from $s$ to $t$ of maximum value

1. $f(u, v) \leftarrow 0$ for all edges $(u,v)$
2. While there is a path $p$ from $s$ to $t$ in $G_{f}$ such that $c_{f}(u,v)>0$ for all edges $(u,v) \in p$:

	1. Find $c_{f}(p)= \min \{c_{f}(u,v):(u,v)\in p\}$
	2. For each edge $(u,v) \in p$

		1. $f(u,v) \leftarrow f(u,v) + c_{f}(p)$ *(Send flow along the path)*
		2. $f(u,v) \leftarrow f(u,v) - c_{f}(p)$ *(The flow might be "returned" later)*
:::
```

_Source:_ [Wikipedia](https://en.wikipedia.org/wiki/Ford%E2%80%93Fulkerson_algorithm)

### Examples

````{myst}
:::{prf:example}
:label: my-example

Next, we shut down randomness in demand and assume that the demand shock
$\nu_t$ follows a deterministic path:


```{math}
\nu_t = \alpha + \rho \nu_{t-1}
```

Again, we’ll compute and display outcomes in some figures

```python
ex2 = SmoothingExample(C2=[[0], [0]])

x0 = [0, 1, 0]
ex2.simulate(x0)
```
:::
````

_Source:_ [QuantEcon](https://python.quantecon.org/lq_inventories.html#Example-2)

### Properties

```{myst}
:::{prf:property}
:label: my-property

This is a dummy property to illustrate the directive.
:::
```

### Observations

```{myst}
:::{prf:observation}
:label: my-observation

This is a dummy observation directive.
:::
```

### Propositions

```{myst}
:::{prf:proposition}
:label: my-proposition

This is a dummy proposition directive.
:::
```

### Assumptions

```{myst}
:::{prf:assumption}
:label: my-assumption

This is a dummy assumption directive.
:::
```

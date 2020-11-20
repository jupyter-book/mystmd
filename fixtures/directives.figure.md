Simple figure:
.
```{figure} https://jupyterbook.org/_static/logo.png
The Jupyter Book Logo!
```
.
<figure id="fig-1" class="numbered">
<img src="https://jupyterbook.org/_static/logo.png">
<figcaption number="1">
<p>The Jupyter Book Logo!</p>
</figcaption>
</figure>
.

Named figure with a caption in a paragraph:
.
```{figure} https://jupyterbook.org/_static/logo.png
:name: test1

The Jupyter Book Logo!
```
.
<figure id="fig-test1" class="numbered">
<img src="https://jupyterbook.org/_static/logo.png">
<figcaption number="1">

<p>The Jupyter Book Logo!</p>
</figcaption>
</figure>
.

Named figure with a caption, no space between options:
.
```{figure} https://jupyterbook.org/_static/logo.png
:name: test2
The Jupyter Book Logo!
```
.
<figure id="fig-test2" class="numbered">
<img src="https://jupyterbook.org/_static/logo.png">
<figcaption number="1">
<p>The Jupyter Book Logo!</p>
</figcaption>
</figure>
.


Named figure with a caption, no space between options:
.
```{figure} https://jupyterbook.org/_static/logo.png
:name: test3
The Jupyter Book Logo!
```

```{figure} https://jupyterbook.org/_static/logo.png
:name: test4
The Jupyter Book Logo again!
```
The reference to {ref}`test3` and {ref}`test4`.
{numref}`test3`
{numref}`test4`
{numref}`Hi 1 <test3>`
{numref}`Hi 2 <test4>`
{numref}`This is 1: %s <test3>`
{numref}`This is 2: %s <test4>`
.
<figure id="fig-test3" class="numbered">
<img src="https://jupyterbook.org/_static/logo.png">
<figcaption number="1">
<p>The Jupyter Book Logo!</p>
</figcaption>
</figure>
<figure id="fig-test4" class="numbered">
<img src="https://jupyterbook.org/_static/logo.png">
<figcaption number="2">
<p>The Jupyter Book Logo again!</p>
</figcaption>
</figure>
<p>The reference to <a href="#fig-test3">Fig 1</a> and <a href="#fig-test4">Fig 2</a>.
<a href="#fig-test3">Fig 1</a>
<a href="#fig-test4">Fig 2</a>
<a href="#fig-test3">Hi 1</a>
<a href="#fig-test4">Hi 2</a>
<a href="#fig-test3">This is 1: 1</a>
<a href="#fig-test4">This is 2: 2</a></p>
.

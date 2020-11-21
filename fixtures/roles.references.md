Testing named figures and numbered references:
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
<p>The reference to <a href="#fig-test3" title="Fig 1">Fig 1</a> and <a href="#fig-test4" title="Fig 2">Fig 2</a>.
<a href="#fig-test3" title="Fig 1">Fig 1</a>
<a href="#fig-test4" title="Fig 2">Fig 2</a>
<a href="#fig-test3" title="Fig 1">Hi 1</a>
<a href="#fig-test4" title="Fig 2">Hi 2</a>
<a href="#fig-test3" title="Fig 1">This is 1: 1</a>
<a href="#fig-test4" title="Fig 2">This is 2: 2</a></p>
.

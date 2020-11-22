Inline math:
.
Math is wrapped in `$`: $e=mc^2$!
.
<p>Math is wrapped in <code>$</code>: <span class="math">\(e=mc^2\)</span>!</p>
.

Inline math as a role:
.
Math is a role: {math}`e=mc^2`!
.
<p>Math is a role: <span class="math">\(e=mc^2\)</span>!</p>
.

Block math:
.
This math is in a block:

$$e=mc^2$$
.
<p>This math is in a block:</p>
<div class="math">\[e=mc^2\]</div>
.

Dollars inline: [FIX: This is not valid HTML output, paragraphs only take phrasing, not divs ...]
.
This math is in a block: $$e=mc^2$$
.
<p>This math is in a block: <div class="math">\[e=mc^2\]</div>
</p>
.

Block math that is numbered:
.
This math is in a block:

$$Ax=b$$ (cool)

$$e=mc^2$$ (best)

In equation {eq}`best` we see that it is {eq}`cool`!
.
<p>This math is in a block:</p>
<div class="math numbered" id="eq-cool" number="1">\[Ax=b\]</div>
<div class="math numbered" id="eq-best" number="2">\[e=mc^2\]</div>
<p>In equation <a href="#eq-best" title="Eq 2">(2)</a> we see that it is <a href="#eq-cool" title="Eq 1">(1)</a>!</p>
.

References to non-existent equations look ok:
.
When there are no equations, this fails: {eq}`not-there`!
.
<p>When there are no equations, this fails: <span class="error" title="The reference 'not-there' was not found.">Reference 'not-there' not found.</span>!</p>
.

You can use different things to cite with:
.
$$Ax=b$$ (matrix)

You can cite with {numref}`matrix` or {ref}`matrix` or {eq}`matrix`.
.
<div class="math numbered" id="eq-matrix" number="1">\[Ax=b\]</div>
<p>You can cite with <a href="#eq-matrix" title="Eq 1">Eq 1</a> or <a href="#eq-matrix" title="Eq 1">Eq 1</a> or <a href="#eq-matrix" title="Eq 1">(1)</a>.</p>
.

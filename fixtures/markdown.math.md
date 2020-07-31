Inline math:
.
Math is wrapped in `$`: $e=mc^2$!
.
<p>Math is wrapped in <code>$</code>: <span class="math">\(e=mc^2\)</span>!</p>
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
<p>This math is in a block: <div class="math">\[e=mc^2\]</div></p>
.

Block math that is numbered:
.
This math is in a block:

$$Ax=b$$ (cool)

$$e=mc^2$$ (best)

In equation {eq}`best` we see that it is {eq}`cool`!
.
<p>This math is in a block:</p>
<div class="math" id="eq-cool">\[Ax=b\] (1)</div>
<div class="math" id="eq-best">\[e=mc^2\] (2)</div>
<p>In equation <a href="#eq-best">(2)</a> we see that it is <a href="#eq-cool">(1)</a>!</p>
.

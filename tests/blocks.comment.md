A simple comment:
.
% A comment
.
<!-- A comment -->
.

A simple comment between two paragraphs:
.
Something
% A comment
Something else
.
<p>Something</p>
<!-- A comment -->
<p>Something else</p>
.

A should sanitize html
.
Something
% A comment --> <script>
Something else
.
<p>Something</p>
<!-- A comment --&gt; &lt;script&gt; -->
<p>Something else</p>
.

# Test for issue/633

The stated problem is that `Button role renders as plain link when wrapped in a div`.

The exmaple given was:
```{myst}
<div>

{button}`my button <https://example.com>`

</div>
```

----

:::{dropdown} Expand to see the fix in action

{button}`my button <https://example.com>`

<div>

{button}`my button <https://example.com>`

<p>This button should have the button class attached</p>
</div>
:::
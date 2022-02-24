# Citations & Bibliography

References allow you to refer to other content in your book or to external content. They allow you to automatically generate links to that content, or to add extra information like numbers to the reference.
This page covers the basics of setting up references to content.

Referencing is accomplished with roles or with markdown link syntax, depending on your use-case. There are a few ways to reference content from your book, depending on what kind of content you’d like to reference.

## Targets & References

Targets are custom anchors that you can refer to elsewhere, for example, a figure, section, table, program, or proof.

## Headers

````{raw} html
<myst-demo>
```{math}
:label: my-eqn
Ax = b
```

Check out this matrix equation: {eq}`my-eqn`
</myst-demo>
````

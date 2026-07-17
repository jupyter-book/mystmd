---
title: References & Links
description: References refer to labeled content and allow you to enumerate figures, tables, code, and headers.
---

% Based loosely on https://jupyterbook.org/content/references.html

References refer to labeled content (e.g. a figure, document or table) and automatically generates links and extra information, like numbering. This page covers the basics of setting up references to content and shows examples for sections, figures, tables and equations.


## Directive Targets and Cross References

Targets are custom anchors that you can refer to elsewhere, for example, a figure, section, table, program, or proof. To be referenceable, they must have a `label`/`identifier` pair in the AST. These can be setup by setting the `label` or `name` option in a directive.

% TODO: name/label redundancy here would nice to be able to simplfy the onboarding (just use label, same as tex and mdast)

```{note}
There is different syntax for creating [Section/Header targets](#targeting-headers) and ways to [label equations](#targeting-equations) when using dollar math.
```

Cross-referencing content is accomplished with markdown link syntax (`[text](#link)`) or through specific roles ([ref](#ref-role), [numref](#numref-role), [eq](#eq-role) or [doc](#doc-role)), depending on your use-case.

### Specification

```{include} ../nodes/crossreference.md

```

### Example

```{include} ../examples/crossreference.md

```

% TODO: There are way to many ways to do the exact same thing here!!

### Using Markdown Links

Using markdown link syntax is one of the most versatile ways to link to content. This uses the standard CommonMark syntax for a link (`[text](#link)`), and the link can either be a label or a link to a document. For example:

````{list-table}
* - MyST Syntax
  - Rendered
* - ```
    [A **bolded _reference_** to a page](./references.md)
    [A reference to a header](#targeting-headers)
    ```
  - [A **bolded _reference_** to a page](./references.md)\
    [A reference to a header](#targeting-headers)
````

```{note}
Markdown links support nested markdown syntax. If you leave the text empty, MyST will fill in the link with the title, caption, document name, or equation number as appropriate.

For example, `[](./footnotes.md)` creates [](./footnotes.md).
```

(ref-role)=

### Using the `{ref}` role

The `{ref}` role can be used to bring the title or caption directly in line, the role can take a single argument which is the label:

```
{ref}`reference-target`
```

You can also choose the reference text directly (not taking from the title or caption) by using:

```
{ref}`your text here <reference-target>`
```

(numref-role)=

### Numbering references with `{numref}`

The `{numref}` role is exactly the same as the above `{ref}` role, but also allows you to use a `%s` in place of the number, which will get filled in when the content is rendered. For example, `` {numref}`Custom Table %s text <my-table-ref>`. `` will become `Custom Table 3 text`. You can try this in the demo above!

% TODO: Can't use this for equations?!
% TODO: numref should just be folded into ref if there is a %s.
% Note: the spec also supports {number} but that should probably raise a warning?!

(eq-role)=

### Using the `{eq}` role

The `` {eq}`my-equation` `` syntax creates a numbered link to the equation, which is equivalent to `[](#my-equation)` as there is no text content to fill in a title or caption.

% TODO: I think we should improve the syntax of links and simplify the explination
% It is annoying that numref and ref don't work for equations.
% You can also not fill in the text with a link. Can we override that?

(doc-role)=

### Using the `{doc}` role

The `` {doc}`./my-file.md` `` syntax creates a link to the document, which is equivalent to `[](./my-file.md)`.

% TODO: move this to the bottom, talk about the markdown links!
% TODO: mystjs - doc role (or just leave unhandled until we can do multi doc)



(targeting-equations)=

### Equations Targets

To reference equations, use the `{eq}` role. It will automatically insert the number of the equation. Note that you cannot modify the text of equation links.

````
```{math}
:label: my-math-label
e=mc^2
```

See Equation {eq}`my-math-label`!
````

`````{tip}
You can also use the `$$` label extension, which follows the second `$$ (label)`.\
This can even all be on a single line!
````
$$
e=mc^2
$$ (my-math-label)

See Equation {eq}`my-math-label`!
````
`````

## Target Node

Placing a Target node allows you to cross reference the subsequent node by target value.

### Specification

```{include} ../nodes/target.md

```

### Example

```{include} ../examples/target.md

```

(targeting-headers)=

### Header Targets

% TODO: We should support pandoc style unnumbered {-} and {.class, #id} syntax

To add labels to a header use `(my-section)=` before the header, these can then be used in markdown links and `{ref}` roles. This is helpful if you want to quickly insert links to other parts of your book.

% TODO: I suppose we can reference a paragraph? But why would we support labeling figures?
% {note} % Labels can be added before any other block of content.

% TODO: numref for sections!?

% Internal/external links
% Checking for missing references, link to another place.

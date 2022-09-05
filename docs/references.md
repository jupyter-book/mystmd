---
title: References and links
description: In MyST you can references labeled content (e.g. a figure, document or table) and automatically generates links and extra information, like numbering.
---

% Based loosely on https://jupyterbook.org/content/references.html

References refer to labeled content (e.g. a figure, document or table) and automatically generates links and extra information, like numbering. This page covers the basics of setting up references to content and shows examples for sections, figures, tables and equations. You can also connect your {wiki}`documents` to external {wiki}`linked <Hyperlink>` content like {wiki}`Wikipedia`, which allow for {wiki}`hover <Hovercraft>`-references with external content (See {ref}`external-references`).

```{seealso}
[](./citations.md) allows you to cite scholarly work and provide bibliographies.
```

## Directive Targets

Targets are custom anchors that you can refer to elsewhere, for example, a figure, section, table, program, or proof. To be referenceable, they must have a `label`/`identifier` pair in the AST. These can be setup by setting the `label` or `name` option in a directive. For example, to label and reference a figure, use the following syntax:

% TODO: name/label redundancy here would nice to be able to simplfy the onboarding (just use label, same as tex and mdast)

````{myst}
```{figure} https://source.unsplash.com/random/500x200/?mountain
:name: my-fig
:align: center

My **bold** mountain 🏔🚠.
```

Check out ways to reference `my-fig`:

* {ref}`my-fig`
* {numref}`my-fig`
* {numref}`See Figure %s <my-fig>`
* [](my-fig)
````

% TODO: `mystjs`: `[]()` syntax not yet working for figures

```{note}
There is different syntax for creating [Section/Header targets](targeting-headers) and ways to [label equations](targeting-equations) when using dollar math.
```

## References

Cross-referencing content is accomplished with markdown link syntax (`[text](link)`) or through specific roles ([ref](ref-role), [numref](numref-role), [eq](eq-role) or [doc](doc-role)), depending on your use-case.

% TODO: There are way to many ways to do the exact same thing here!!

### Using Markdown Links

Using markdown link syntax is one of the most versatile ways to link to content. This uses the standard CommonMark syntax for a link (`[text](link)`), and the link can either be a label or a link to a document. For example:

````{list-table}
* - MyST Syntax
  - Rendered
* - ```
    [A **bolded _reference_** to a page](./citations.md)
    [A reference to a header](targeting-headers)
    ```
  - [A **bolded _reference_** to a page](./citations.md)\
    [A reference to a header](targeting-headers)
````

```{note}
Markdown links support nested markdown syntax. If you leave the text empty, MyST will fill in the link with the title, caption, document name, or equation number as appropriate.

For example, `[](./citations.md)` creates [](./citations.md).
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

The `` {eq}`my-equation` `` syntax creates a numbered link to the equation, which is equivalent to `[](my-equation)` as there is no text content to fill in a title or caption.

% TODO: I think we should improve the syntax of links and simplify the explination
% It is annoying that numref and ref don't work for equations.
% You can also not fill in the text with a link. Can we override that?

(doc-role)=

### Using the `{doc}` role

The `` {doc}`./my-file.md` `` syntax creates a link to the document, which is equivalent to `[](./my-file.md)`.

% TODO: move this to the bottom, talk about the markdown links!
% TODO: mystjs - doc role (or just leave unhandled until we can do multi doc)

(targeting-headers)=

### Header Targets

To add labels to a header use `(my-section)=` before the header, these can then be used in markdown links and `{ref}` roles. This is helpful if you want to quickly insert links to other parts of your book.

```{myst}
(my-section)=
#### Header _Targets_

You can use `(label)=` before the element that you want to target. Then reference content with:

* {ref}`my-section`
* {ref}`Custom title <my-section>`
* [](my-section)
```

% TODO: We should support pandoc style unnumbered {-} and {.class, #id} syntax

% TODO: I suppose we can reference a paragraph? But why would we support labeling figures?
% {note} % Labels can be added before any other block of content.

% TODO: numref for sections!?

(targeting-equations)=

### Equations Targets

To reference equations, use the `{eq}` role. It will automatically insert the number of the equation. Note that you cannot modify the text of equation links.

````{myst}
```{math}
:label: my-math-label
e=mc^2
```

See Equation {eq}`my-math-label`!
````

`````{tip}
You can also use the `$$` label extension, which follows the second `$$ (label)`.\
This can even all be on a single line!
````{myst}
$$
e=mc^2
$$ (my-math-label)

See Equation {eq}`my-math-label`!
````
`````

% Internal/external links
% Checking for missing references, link to another place.

## Numbering

By default section numbering for headers is turned off with numbering for figure and table numbering enabled.
To turn on `numbering` for headers, you can can change the frontmatter in the document or project.

```{myst}

---
numbering:
  heading_2: true
  heading_3: true
---

(my-chapter)=
## My Chapter

(my-section)=
### My Section

(my-section2)=
### My Second Section

* {numref}`my-chapter`
* {numref}`my-section`
* {numref}`my-section2`
```

(external-references)=

## External References

External references are references to structured content on other pages.
MyST currently supports other MyST pages or Wikipedia articles.

```md
Primordial {wiki}`gravitational waves` are hypothesized...
```

> Primordial {wiki}`gravitational waves` are hypothesized to arise from {wiki}`cosmic inflation`, a faster-than-light expansion just after the {wiki}`big bang`.

The link will take you to Wikipedia, as well as provide a tooltip and description directly on the page.

To show a different text you can use a similar technique to references: `` {wiki}`text <reference>` ``

```md
{wiki}`big bang <The Big Bang Theory>` vs {wiki}`big bang`
```

> {wiki}`big bang <The Big Bang Theory>` vs {wiki}`big bang` vs {wiki}`big bang <Big_Bang_(book)>` vs {wiki}`💥`

### Linking to other MyST Projects

When using the HTML renderer for MyST, an API is provided for the deployed site.
This provides pre-parsed, structured content as mdast that can be included and rendered in a tooltip.

```{tip}
Try adding `.json` at the end of the URL on this page, it will provide authors, license information,
as well as the full content in a parsed form that can be used for an inline reference.
```

```{note}
Currently cross-project links aren't fully implemented, check back soon!
```

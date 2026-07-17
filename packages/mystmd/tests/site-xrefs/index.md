# XRef Content

link not xref: [MyST](https://mystmd.org)

## From this project

other page: [](#page-fm-label)

also other page: @page-title-label

implicit heading: [](#implicit-heading)

explicit heading: [](#explicit-heading)

figure: [](#my-fig)

Embedded section with xref ⬇️

```{embed} #section-with-xref

```

Embedded code-block with xref
```{embed} #my-code
:remove-input: true
:remove-output: true
```

## From external project

xref to intersphinx: [Python ABC](xref:python#library/abc)

xref to myst: [](xref:spec#admonition)

implicit xref to myst: @xref:spec/tables#example

xref to page: <xref:spec/tables>

xref to project: [](xref:spec)

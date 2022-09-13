---
title: Create a Template
description: jtex templates have a template.yml, template.tex, and any other images, class or definition files required for the template to render.
---

A `jtex` template contains everything necessary to create a $\LaTeX$ document, including a `template.yml`, the main `template.tex`, and any associated files such as classes (`*.cls`), definitions (`*.def`), or images (`*.png`). An example template folder is laid out as:

```text
my_template
├── README.md
├── template.yml
├── article.cls
├── template.tex
├── logo.png
├── example
│   ├── frontmatter.yml
│   ├── references.bib
│   └── content.tex
└── original
    ├── main.tex
    ├── ...
    └── sample.bib
```

You can include the original template in the `original` folder, which is often handy to check on as you transform it to a template.
If you need example data to create a default PDF, then store it in an `example` folder.

To see the contents and structure of `template.yml`, see [](./template-yml.md), which defines a number of parameters and options that are available when rendering your template. The structure of the document model has standard properties, like `title`, as well as custom `template.yml` defined properties. These properties are defined in [](./document.md).

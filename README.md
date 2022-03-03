# MyST Spec

MyST (Markedly Structured Text) is designed to create publication-quality, computational documents written entirely in Markdown. The main use case driving the development and design of MyST is [JupyterBook](https://jupyterbook.org/), which creates educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST.

MyST is a superset of [CommonMark](https://commonmark.org/) (a standard form of Markdown) and allows you to directly create “directives” and “roles” as extension points in the language. These extensions points are influenced by [ReStructured Text (RST)](https://en.wikipedia.org/wiki/ReStructuredText) and [Sphinx](https://www.sphinx-doc.org/) -- pulling on the nomenclature and introducing additional standards where appropriate. `directives` are block-level extension points, like callout panels, tabs, figures or embedded charts; and `roles` are inline extension points, for components like references, citations, or inline math.

````md
```{directive} Argument
The *content* of a directive can have {role}`with content`
```
````

## Goals

`myst-spec` is designed to standardize implementations and extensions to MyST, with the goal of making the MyST ecosystem as rich and interoperable as possible. The spec formalizes three formats:

1. the MyST markup syntax, to ensure MyST works as expected across languages and implementations;
2. the MyST abstract syntax tree (AST), to promote an ecosystem of transformations and exports to diverse formats (e.g. latex/word/html/docutils/etc.); and
3. suggested semantic HTML output and CSS class structure, to promote web-accessibility and interoperability of themes.

The `myst-spec` will be improved overtime through enhancement proposals which can be submitted by our multi-stakeholder community. [IN PROGRESS]

## MyST Spec

This repository introduces tests to cover the MyST Spec. These tests cover three target formats: `myst`, `mdast`, and `html`. An simple example test case (in yaml) for a header looks like:

```yaml
cases:
  - title: CommonMark headers
    myst: |-
      # Heading!
    mdast:
      type: root
      children:
        - type: heading
          depth: 1
          children:
            - type: text
              value: Heading!
    html: |-
      <h1>Heading!</h1>
```

[TBD: Do we include latex here, maybe?]

### Markdown Abstract Syntax Tree, `mdast`

Markdown AST, or `mdast`, is an intermediate format that builds upon the existing [mdast spec](https://github.com/syntax-tree/mdast), which is used throughout the [unifiedjs](https://unifiedjs.com/) Javascript community with hundreds of [existing transformations](https://unifiedjs.com/explore/), [utilities](https://unifiedjs.com/explore/keyword/unist-util/) and [serializers](https://unifiedjs.com/explore/keyword/rehype/). `mdast` is simple, with a `type` defining the node optional properties on the node and optional `children` (a leaf node has a `value`).

Beyond CommonMark and GitHub Flavoured Markdown, MyST introduces new directives and roles (like admonitions, citations, equations) following existing standards where they are defined. `mdast` is serializable to JSON or YAML, and can be effectively shared between projects, languages and implementations. The output of this repository is a versioned JSON file that can be used in implementations of MyST.

### Structure of the Repository

[TBD]

## Relation to other markup languages, frameworks

[TODO]

* CommonMark
* GitHub Flavored Markdown
* Pandoc
* Unified
* Markdown-It

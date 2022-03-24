# MyST Specification

```{warning}
`myst-spec` is still in development; any structures or features present in the JSON schema may change at any time without notice.
```

MyST (Markedly Structured Text) is designed to create publication-quality, computational documents written entirely in Markdown. The main use case driving the development and design of MyST is [JupyterBook](https://jupyterbook.org/), which creates educational online textbooks and tutorials with Jupyter Notebooks and narrative content written in MyST.

## Overview

There are three components that this documentation and repository aims to formalize: (1) the MyST markup language, which is a superset of [CommonMark](https://commonmark.org/) (a standard form of Markdown); (2) the MyST abstract syntax tree (AST), which is the datastructure of a document after it has been parsed, and can be used in transforming and rendering content; and (3) a set of unittests that can be used to test implementations of MyST (e.g. in Python and Javascript).

## MyST Markup Langauge

MyST is a superset of [CommonMark](https://commonmark.org/) (a standard form of Markdown) and allows you to directly create “directives” and “roles” as extension points in the language. These extensions points are influenced by [ReStructured Text (RST)](https://en.wikipedia.org/wiki/ReStructuredText) and [Sphinx](https://www.sphinx-doc.org/) -- pulling on the nomenclature and introducing additional standards where appropriate. `directives` are block-level extension points, like callout panels, tabs, figures or embedded charts; and `roles` are inline extension points, for components like references, citations, or inline math.

## MyST Abstract Syntax Tree

Fundamentally, the specification for MyST documents can be broken down into abstract syntax tree (AST) node types and their document-level counterparts. The `myst-spec` AST builds on [Markdown AST, or `mdast`](https://github.com/syntax-tree/mdast), an intermediate format that in turn builds upon the existing [Universal Syntax Tree, or `unist` spec](https://github.com/syntax-tree/unsit). `unist` is used throughout the [unifiedjs](https://unifiedjs.com/) Javascript community with hundreds of [existing transformations](https://unifiedjs.com/explore/), [utilities](https://unifiedjs.com/explore/keyword/unist-util/) and [serializers](https://unifiedjs.com/explore/keyword/rehype/). `unist` has a simple, with a `type` defining the node optional properties on the node and optional `children` (a leaf node has a `value`).

The MyST AST introduces nodes for directives and roles, as well as numerous new features, like admonitions, citiations, and equations, all of which build upon `mdast` and other existing standards and nomenclature. The MyST AST, like `mdast`, is serializable to JSON or YAML, and can be effectively shared between projects, languages, and implementations.

### Working with the MyST AST

This documentation contains all the node types used to construct a MyST document. Conventionally, the AST representation of a MyST document represents the state immediately after parsing. This means, for example, references are not resolved, directive/role structures are still present, etc. You may work with AST nodes by either modifying or adding to them to modify and update the corresponding MyST document, or you may transform and reduce them into a simpler structure to consume in other contexts.

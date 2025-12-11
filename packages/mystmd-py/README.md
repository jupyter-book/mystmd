# MyST Markdown Command Line Interface, `mystmd`

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jupyter-book/mystmd/blob/main/LICENSE)
![CI](https://github.com/jupyter-book/mystmd/workflows/CI/badge.svg)

`mystmd` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

> **Note**
> The `mystmd` project is in **beta**. It is being used to explore a full MyST implementation and will change significantly and rapidly.
> The project is being developed by a small team of people on the Executable Books Project, and may make rapid decisions without fully public/inclusive discussion.
> We will continue to update this documentation as the project stabilizes.

## Overview

The `mystmd` project provides a command line tool (`mystmd`) for working with MyST Markdown projects.

- Provides functionality for cross-referencing, external structured links, and scientific citations
- Translate and render MyST Markdown into:
  - HTML for static websites, and modern React for interactive websites (like this website!)
  - PDFs and LaTeX documents, with specific templates for over 400 journals
  - Microsoft Word export
- Parse MyST into a standardized AST, that follows the MyST Markdown Spec

See the [documentation](https://mystmd.org/guide).

## Get Started

The MyST Markdown CLI is available through PyPI:

```bash
pip install mystmd
myst init
myst build my-doc.md --tex
```

and Conda:

```bash
conda config --add channels conda-forge
conda config --set channel_priority strict
conda install mystmd
myst init
myst build my-doc.md --tex
```

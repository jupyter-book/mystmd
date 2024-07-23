# MyST Markdown Command Line Interface, `mystmd`

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/jupyter-book/mystmd/blob/main/LICENSE)
![CI](https://github.com/jupyter-book/mystmd/workflows/CI/badge.svg)
[![Discord Chat](https://img.shields.io/badge/discord-chat-blue?logo=discord&logoColor=white)](https://discord.mystmd.org)

`mystmd` is a set of open-source, community-driven tools designed for scientific communication, including a powerful authoring framework that supports blogs, online books, scientific papers, reports and journals articles.

> [!NOTE]
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

Ensure that you have an updated version of Node installed (<https://nodejs.org/>):

```bash
node -v
>> v20.4.0
```

The MyST Markdown CLI is available through NPM, PyPI and Conda:

```bash
# Using npm, yarn, or pnpm
npm install -g mystmd
# Or using PyPI
pip install mystmd
# Or using Conda / Mamba
conda install mystmd -c conda-forge
```

Usage:

```bash
myst init
myst start
myst build my-doc.md --tex
```

# Development

See [the Contribution Guide](CONTRIBUTING.md) for information on setting up a development environment.

---

As of v1.0.0 this package is [ESM only](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c).

---

---
title: Testing Math Plugins
date: 1 Jan 2024
math:
  '\one': 'x'
  '\six': 'd = \three'
  '\seven': 'd = \six'
exports:
  - output: _build/exports/index.tex
  - output: _build/exports/index.typ
  - docx
  - jats
---

# No plugins

$$
a^2 + b^2 = c^2
$$

# Simple plugin

Project frontmatter should give us `d`

$$
d = \three
$$

Page should override and we should see `x`

$$
x = \one
$$

# Macros should recurse

Page frontmatter should fill in this project macro

$$
\five
$$

Project frontmatter should fill in this page macro

$$
\six
$$

Double recurse

$$
\seven
$$
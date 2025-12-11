---
title: MyST Content Versions
---

The following page describes changes to the MyST content that is served from the `.json` endpoint of a MyST Site. The `myst-migrate` package can be used to translate between versions by upgrading and downgrading between versions.

The version is a string integer (i.e. `'1'` or `'2'`) and is incremented with every change to the content of a MyST page, which includes metadata as well as the MyST AST.

# MyST Versions

:::{myst:versions}

:::

## Version 0 — _before_ 2025-02-01

This is the first version of MyST AST considered to be versioned, subsequent releases will have changes for migrating the content between versions.

---
title: Exporting CITATION.cff
description: MyST can be used to generate a `CITATION.cff` file for your project, reducing duplication of citation information.
---

The [Citation File Format](https://github.com/citation-file-format/citation-file-format) is a human-readable format for declaring citation information, particularly for software and datasets. By adding a `CITATION.cff` file to your project, other researchers know exactly how your project should be cited. This makes authors' lives easier, improves citations to your project, and enables reproducibility by pointing readers directly to the software/data repository. The Citation File Format is supported by GitHub, Zenodo, and Zotero. 

In MyST, much of the citation information is already present in the `myst.yml` file. Rather than duplicating information between `myst.yml` and `CITATION.cff`, you may instead export `CITATION.cff` from MyST. This behaves like a standard [export](./documents-exports.md):

```yaml
version: 1
project:
  ...
  exports:
    - cff
```

There are fields in the Citation File Format that are not present in `myst.yml`. To include these, you may add them to your export. Available fields are [described in the `citation-file-format` repository](https://github.com/citation-file-format/citation-file-format/blob/main/schema-guide.md). For example:

```yaml
version: 1
project:
  ...
  exports:
    - format: cff
      date-released: '2021-07-18'
      commit: b49bf7feb3913b15a29cdc8c246e75df4ed4def9
```
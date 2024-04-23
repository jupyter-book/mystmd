# myst-toc

Utilities to parse a MyST table of contents.

## Overview
The MyST ToC format is defined in `types.ts`, from which a JSON schema definition is compiled. The high-level description is as follows:

1. A TOC comprises of an array of TOC items
2. Each TOC item can be 
  - A file (document)
  - A URL (document)
  - A collection of child items
3. TOC items containing children *must* have either a `title` or a document


## Example
Example `myst.yml` under the `toc:` key:
```yaml
toc:
  - title: Main
    file: main.md
  - title: Overview
    children:
      - file: overview-1.md
      - file: overview-2.md
  - url: https://google.com
  - file: getting-started.md
    children:
      - file: getting-started-part-1.md
      - file: getting-started-part-2.md
```

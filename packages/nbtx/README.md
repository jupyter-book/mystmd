# @curvenote/nbtx

Transform and manipulate Jupyter notebook json files (ipynb), converting these to and from more compact data structures used by Curvenote.

Specific functionality included is:

- `translators` - moves between parts of `ipynb` json and json representations of the notebook, cells and outputs
- `summarise` - an abstraction layer on top of the `output` arrays produced by code cells. These abstractions allow groups of `mimetypes` to be handled together, as well as nominating primary and fallback `mimetypes` to use for a partcular output. The summarized outputs may also have their content truncated and moved to storage (blob/file) if it is large.

## Installation

Install using `npm` or `yarn`

```
npm install @curvenote/nbtx
```

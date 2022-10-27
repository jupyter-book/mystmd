# nbtx

Transform and manipulate Jupyter Notebook json files (`*.ipynb`), converting these to and from more compact data structures, which are useful for efficient and async loading in the context of a web-based viewer.

Specific functionality included is:

- `translators` - moves between parts of `*.ipynb` json and json representations of the notebook, cells and outputs
- `summarise` - an abstraction layer on top of the `output` arrays produced by code cells. These abstractions allow groups of `mimetypes` to be handled together, as well as nominating primary and fallback `mimetypes` to use for a partcular output. The summarized outputs may also have their content truncated and moved to remote storage (blob/file) if it is large.

## Installation

Install using `npm`:

```
npm install nbtx
```

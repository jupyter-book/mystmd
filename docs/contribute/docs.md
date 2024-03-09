# Contribute to the documentation

## Build the MyST guide documentation locally

To build the MyST guide documentation:

1. Clone this repository:

   ```
   git clone https://github.com/executablebooks/mystmd
   ```
2. [Install MyST Markdown by following these instructions](https://mystmd.org/guide/quickstart)
3. Navigate to the docs folder:

   ```
   cd docs/
   ```
4. Start a MyST server to preview the documentation:

   ```
   myst start
   ```

This will build the documentation locally so that you can preview what your changes will look like.


## How this relates to the documentation at mystmd.org

The documentation in this repository serves the content that lives [at `mystmd.org/guide`](https://mystmd.org/guide).

The full content and theme for [`mystmd.org`](https://mystmd.org) is [hosted at `curvenote/mystmd.org`](https://github.com/curvenote/mystmd.org), which pulls in the content from this folder along with several other documentation sources into one place.

However, the documentation here can be built independently for previewing your changes.


## The documentation theme infrastructure

The MyST documentation uses a custom theme that inherits from a chain of base themes.
Here's a brief overview of where to look for things:

- The MyST documentation theme is a custom theme defined [at the `curvenote/mystmd.org` repository](https://github.com/curvenote/mystmd.org).
- It uses a modified version of [the MyST Book theme at `myst-templates/book-theme`](https://github.com/myst-templates/book-theme).
- The Book Theme inherits from [the bast MyST theme at `executablebooks/myst-theme`](https://github.com/executablebooks/myst-theme).

Note that the CurveNote repository does not follow the standard practice for build a MyST site.

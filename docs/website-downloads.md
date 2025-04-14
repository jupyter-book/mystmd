---
title: Downloads, Links and Static Files
short_title: Downloads & Static Files
description: Add download links to your website on each page or project
---

Downloads are downloadable files or useful links you want available on your MyST site. They may be defined at the project or the page level.

- If you specify project-level `downloads:` configuration, it will **append** each item to the source-file download of each page.
- If you specify page-level `downloads:` configuration, it will **override** project-level configuration as well as page defaults.

## Add a download link

Each download link entry has configuration that modifies its behavior.
Note that each entry may only specify one of `id`, `file`, or `url`.
Descriptions of these fields and other available fields are in the table below from the [downloads configuration](#frontmatter:downloads).

![](#table-frontmatter-downloads)

For example,

```{code-block} yaml
:label: config-page-download
:filename: article.md
---
downloads:
  - file: ./interesting-photo.png
    title: An interesting photograph
---
```

:::{tip} Define downloads for all pages
In [the above example](#config-page-download), the download configuration was defined for a single page (article.md). If you want to add downloads to every page, you can set the download information at the project level:

```{code-block} yaml
:label: config-proj-download
:filename: myst.yml

project:
  ...
  downloads:
    - file: ./interesting-photo.png
      title: An interesting photograph

```

:::

## Include an exported PDF

If you want to include a PDF of your document with the downloads, take these steps:

1. **Create a PDF export target**. For examples of how to build PDFs, see [](creating-pdf-documents.md). Let's say the PDF was output to `./mydoc.pdf`, then the following frontmatter would define a PDF export and give it a unique identifier `my-document-export`:
   ```{code-block} yaml
   :filename: article.md
   :linenos:
   :emphasize-lines: 3,4,5,6
   ---
   exports:
     - format: pdf
       template: lapreprint-typst
       output: exports/my-document.pdf
       id: my-document-export
   ---
   ```
2. **Add a download for that export**. The `id` field should match the one defined for your PDF, e.g.
   ```{code-block} yaml
   :filename: article.md
   :linenos:
   :emphasize-lines: 8,9
   ---
   exports:
     - format: pdf
       template: lapreprint-typst
       output: exports/my-document.pdf
       id: my-document-export
   downloads:
     - id: my-document-export
       title: A PDF of this document
   ---
   ```
3. **Build the PDF**. Run the `myst build` command to build the PDF, e.g.
   ```bash
   myst build --pdf
   ```

An entry for this PDF will now show up in your page's downloads dropdown.

:::{note} Updating your GitHub Pages deployment
:class: dropdown

If you're [deploying a static site with GitHub pages](./deployment-github-pages.md), then you will need to add a new step that builds the PDF _before_ building the website. For example:

```{code-block} yaml
:filename: .github/workflows/deploy.yml
:emphasize-lines: 17, 18
:linenos:

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 18.x
      - name: Install MyST Markdown
        run: npm install -g mystmd
      - name: Build PDF Assets
        run: myst build --pdf
      - name: Build HTML Assets
        run: myst build --html
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './_build/html'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

:::

## Include a raw source file

You may include the raw source of a file as a download by referencing the file itself in the download frontmatter.
For example inside file `index.md`, you may do:

```yaml
downloads:
  - file: index.md
    title: Source File
```

(multiple-downloads)=

## Include several downloads at once

The following example has several downloads: the source file, as above, an exported pdf, a remote file, and a link to another website.
In addition, when you specify `downloads:`, it will over-ride the default download behavior (which is to link to the source file of the current page).
This example manually includes a download to the source file to re-enable this.

```{code-block} yaml
:filename: index.md
---
exports:
  - output: paper.pdf
    template: lapreprint-typst
    id: my-paper
downloads:
  - file: index.md
    title: Source File
  - id: my-paper
    title: Publication
  - url: https://example.com/files/script.py
    filename: script.py
    title: Sample Code
  - url: https://example.com/more-info
    title: More Info
---
```

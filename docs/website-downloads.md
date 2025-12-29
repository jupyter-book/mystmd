---
title: Downloads, Links and Static Files
short_title: Downloads & Static Files
description: Add download links to your website on each page or project
---

You can bundle files with your MyST site for others to download and re-use.
There are two ways to specify downloads with a MyST site.

:::{note} Download URLs will changed based on the file content
MyST will generated a _hashed filename_ for any files bundled with your site.
For example: `myfile.[HASH].png`.
This means download URLs will not be persistent if the content changes.

See this issue tracking how to make these URLs stable: https://github.com/jupyter-book/mystmd/issues/1196
:::

## Use the `{download}` role

The {myst:role}`download` role takes a path to a file, and generates a download link from it.
Such a role may be defined at the project or the page level.

For example:

::::{grid} 2

```markdown
{download}`references.bib`
```

{download}`references.bib`
::::

(download-link)=
## Use project or page configuration

There are some special configuration fields to specify files that should be bundled for download with your site. These are:

![](#frontmatter-downloads)

Each entry in your download configuration may specify one of `id`, `file`, or `url`.
Descriptions of these fields and other available fields are in the table below from the [downloads configuration](#frontmatter:downloads).

![](#table-frontmatter-downloads)

:::{note} An example download configuration

To add the download to only one page:

```{code-block} yaml
:label: config-page-download
:filename: article.md
---
downloads:
  - file: ./interesting-photo.png
    title: An interesting photograph
---
```

To add the download to all pages in a MyST project:

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


(include-exported-pdf)=
## How to include an exported PDF with your site

If you want to include a PDF of your document with the downloads, take these steps:

1. **Create a PDF export target**. For example, the following page frontmatter defines a PDF export, gives it the unique identifier `my-document-export`, and will output the file `exports/my-document.pdf`:
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
4. **Build your website**. Now that you've built the PDF and added frontmatter for the download button, re-building your site will add a new download dropdown linked to the PDF that you've exported.

### Include exported files with GitHub Pages
If you're [deploying a static site with GitHub pages](./deployment-github-pages.md), then you will need _two build steps_ to add exported PDF files to your website. Ensure your content [has the proper PDF export frontmatter](#include-exported-pdf), then follow these two steps in your CI.

1. First, install the PDF build dependencies and build the PDF with `myst build --pdf`. In the example below, we'll show how to install Typst with the [`setup-typst` GitHub action][typst-gha].
2. Second, build the website with `myst build --html`. Because your PDF has already been generated, your website will now include it.

See below for sample configuration that accomplishes this:

:::{note} Example GitHub Action configuration to include PDF with GitHub Pages
:class: dropdown
```{code-block} yaml
:filename: .github/workflows/deploy.yml
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
      
      # Install MyST and PDF dependencies
      - name: Install MyST Markdown
        run: npm install -g mystmd
      - name: Setup Typst
        uses: typst-community/setup-typst@v4
      
      # Build PDF and then HTML
      - name: Build PDF Assets
        run: myst build --pdf
      - name: Build HTML Assets
        run: myst build --html
      
      # Upload to GitHub Pages
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './_build/html'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4


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

[typst-gha]: https://github.com/marketplace/actions/setup-typst

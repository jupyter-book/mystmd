---
title: Working with MyST Websites
subtitle: Create a website like this one
subject: MyST Quickstart Tutorial
short_title: MyST Websites
description: A MyST project is collection of MyST markdown files and jupyter notebooks with a configuration file called "myst.yml".
---

::::{important}
**Objective**

The goal of this quickstart is to get you up and running on your local computer 👩‍💻, create a local website 🌎, and edit elements of the theme to improve the website style 🎨.

The tutorial will be brief on explaining MyST syntax, we provide a [MyST Markdown Guide](./quickstart-myst-markdown.md) that provides more depth on syntax and pointers to other resources.
::::

![](#lookout-for-tutorial-actions)

(install-myst-dropdown)=
::::{tip}
:class: dropdown

## 🛠 Install the MyST CLI

🛠 Install the MyST command line tools, with `node` **greater than version v16**:

```bash
npm install -g myst-cli
```

:::{card} Need more help? See MyST Installation Quickstart
:link: ./quickstart.md
See the first quickstart tutorial for installation walk-through and installation prerequisites.
:::
::::

:::{tip}
:class: dropdown

## 🛠 Download quickstart content

We are going to download an example project that includes a few simple markdown files and some Jupyter Notebooks.
Our goal will be to try out some of the main features of `myst` to create a website like this one, improve the structure of the metadata, share it between pages, and improve the website theme.

🛠 Download the example content, and navigate into the folder:

```bash
git clone https://github.com/executablebooks/mystjs-quickstart.git
cd mystjs-quickstart
```

:::

## Initialize MyST 🚀

Next we will create a `myst.yml` configuration file that is required to render your project.

🛠 Run `myst`

The `myst` command is a shortcut for `myst init`, which has a few more options for writing specific parts of the configuration file and a table of contents for your site.

```text
> myst

Welcome to the MyST CLI!! 🎉 🚀

myst init walks you through creating a myst.yml file.

You can use myst to:

 - create interactive websites from markdown and Jupyter Notebooks 📈
 - build & export professional PDFs and Word documents 📄

Learn more about this CLI and MyST Markdown at: https://myst-tools.org

💾 Writing new project and site config file: myst.yml
```

🛠 When prompted, type `Yes` to install and start the default theme (takes about 15 seconds)

```bash
? Would you like to run "myst start" now? Yes
```

If you cancelled the command, you can start the server with `myst start`.
Starting the server requires a theme, this will download the default `book-theme`, which you can change later.
The theme will now install using `node` and `npm`, this can take **up to a minute** the first time, and then will be cached in the `_build/templates` directory.

```text
🐕 Fetching template metadata from https://api.myst-tools.org/templates/site/myst/book-theme
💾 Saved template to path _build/templates/site/myst/book-theme
⤵️ Installing web libraries (can take up to 60 s)
📦 Installed web libraries in 13 s
📖 Built interactive-graphs.ipynb in 21 ms.
📖 Built paper.md in 32 ms.
📖 Built README.md in 35 ms.
📚 Built 3 pages for myst in 82 ms.

  ✨✨✨  Starting Book Theme  ✨✨✨

⚡️ Compiled in 524ms.

🔌 Server started on port 3000!  🥳 🎉

  👉  http://localhost:3000  👈
```

🛠 Open your web browser to `http://localhost:3000`[^open-port]

[^open-port]: If port `3000` is in use on your machine, an open port will be used instead, follow the link provided in the terminal.

The example site in this tutorial only has three pages and by default the `01-paper.md` page is seen in [](#frontmatter-before), which has minimal styles applied to the content.

:::{figure} ./images/frontmatter-before.png
:width: 50%
:name: frontmatter-before
:class: framed

The myst theme for the `01-paper.md` page without any changes made.
:::

### Folder Structure

If you are using a text editor, for example [VSCode](https://code.visualstudio.com/), open up the folder to explore the files:

```text
quickstart/
  ├── 🆕 _build
  │   ├── exports
  │   ├── site
  │   │   ├── content
  │   │   ├── public
  │   │   └── config.json
  │   ├── temp
  │   └── templates
  │       ├── site/myst/book-theme
  │       └── tex/myst/arxiv_two_column
  ├── images
  │   ├── image.png
  │   └── image.gif
  ├── 01-paper.md
  ├── 02-notebook.ipynb
  ├── README.md
  └── 🆕 myst.yml
```

Running `myst init` added:

- `myst.yml` - the configuration file for your myst project and site
- `_build` - the folder containing the processed content and other `site` assets, which are used by the local web server.

The `_build` folder also contains your templates (including the site template you installed) and any exports you make (when we build a PDF the exported document will show up in the `_build/exports` folder). You can clean up the built files at any time using `myst clean`[^clean-all].

[^clean-all]:
    By default the `myst clean` command doesn't remove installed templates, however, the function can with a:\
    `myst clean --all`, or\
    `myst clean --templates`.

    Before deleting any folders `myst` will confirm what is going to happen, or you can bypass this confirmation with the `-y` option. For example:

    ```text
    Deleting all the following paths:

      - _build/site
      - _build/templates

    ? Would you like to continue? Yes

    🗑 Deleting: _build/site
    🗑 Deleting: _build/templates
    ```

## Configuration ⚙️

If we open and look inside our `myst.yml` we will see a basic configuration like this:

```yaml
# See docs at: https://myst-tools.org/docs/mystjs/frontmatter
version: 1
project:
  # title:
  # description:
  keywords: []
  authors: []
  # github:
  # bibliography: []
site:
  template: book-theme
  # title:
  # logo:
  nav: []
  actions:
    - title: Learn More
      url: https://myst-tools.org/docs/mystjs
  domains: []
```

There are two important parts to the `myst.yml`:

`project:`
: The project holds metadata about the collection of files, such as authors, affiliations and licenses for all of the files, any of these values can optionally be overridden in a file. To see all of the options see [](./frontmatter.md), which includes which fields can be overridden by files in the project.

`site:`
: The site holds template information about the website, such as the logo, navigation, site actions and which template to use.

🛠 In `myst.yml`: Change the "`# title:`" comment in **site** to "`title: Fancy Title 🎩`" and save

Saving the `myst.yml` will have triggered a "full site rebuild"[^myst-start] and in about ⚡️ 20ms ⚡️ take a look at the browser tab:

:::{figure} ./images/frontmatter-site-title.png
:width: 50%
:name: frontmatter-site-title

The site title will control site meta tags, and the browser-tab title, which is appended to each page title in the `book-theme`.
:::

[^myst-start]: If the server stopped, you can restart the server using `myst start`.

:::{seealso}
**See all Frontmatter options**

To see all of the options see [](./frontmatter.md), which includes which fields can be overridden by files in the project.
:::

:::{note}
:class: dropdown
**Separating Project and Site Configurations**

% TODO: move this to a new quickstart that is specific about advanced config.
You may use separate the `project` and `site` configurations into multiple `myst.yml` files to configure your website. Each website needs a single `site` configuration at the root level; then any subdirectory with content may have its own `project` configuration with project-specific frontmatter. For example, given a `content` directory with all your markdown and notebooks,you can create a `content/myst.yml` file with project frontmatter:

```yaml
version: 1
project:
  title: ...
  authors: ...
  ...
```

and a root-level `myst.yml` file that references the project in the `content` subfolder:

```yaml
version: 1
site:
  template: book-theme
  projects:
    - slug: my-content
      path: content
  ...
```

Doing this will keep the `_build` directory at the root level, but everything else outside of the `content` folder will be ignored. If you have a project in the same configuration file it can be accessed with `path: .`. Projects are "mounted" at the `slug:` (i.e. `/my-content/`) above.
:::

More Coming Soon™

- logos
- table of contents ([](./table-of-contents.md))
- actions
- themes

---

## Conclusion 🥳

For now, that's it for this quickstart tutorial, we will add more about changing logos, themes, the table of contents, and much more soon!
As for next steps you can export MyST Markdown as traditional documents like PDFs and Word, take a look at:

:::{card} MyST Documents 📑
:link: ./quickstart-myst-documents.md
Learn the basics of MyST Markdown, and export to a Word document, PDF, and $\LaTeX$!
:::

:::{card} MyST Markdown Guide 📖
:link: ./quickstart-myst-markdown.md
See an overview of MyST Markdown syntax with inline demos and examples.
:::

% A MyST project is collection of MyST markdown files and Jupyter Notebooks with a configuration file `myst.yml` in the root directory. These files may be structured by defining an explicit [table of contents](./table-of-contents.md) `_toc.yml` in the same directory as the configuration file, or MyST will infer the structure from the directory structure. The project config may define a specific file to be the `index` file; it may also define a list of files to `exclude`.

% Aside from structuring your project, the project config in `myst.yml` defines project [frontmatter](./frontmatter.md), fields such as `author`, `keywords`, etc. This frontmatter applies to all pages in the project and may be substituted when the corresponding field is not defined on the page.

% You may use the `myst init` command to initialize a MyST project in an existing directory.

% ## MyST Site

% A site configuration may also be defined in a `myst.yml` file. A site can reference one or more projects, defines additional frontmatter, and provides templating settings to build websites.

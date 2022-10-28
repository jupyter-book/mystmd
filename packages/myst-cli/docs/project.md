# MyST Project

A MyST project is collection of MyST markdown files and jupyter notebooks with a configuration file `myst.yml` in the root directory. These files may be structured by defining an explicit table of contents `_toc.yml` in the same directory as the configuration file, or MyST will infer the structure from the directory structure. The project config may define a specific file to be the `index` file; it may also define a list of files to `exclude`.

Aside from structuring your project, the project config in `myst.yml` defines project frontmatter, fields such as `author`, `keywords`, etc. This frontmatter applies to all pages in the project and may be substituted when the corresponding field is not defined on the page.

You may use the [myst init](#myst-init) command to initialize a MyST project in an existing directory.

# MyST Site

A site configuration may also be defined in a `myst.yml` file. A site references one or more projects, defines additional frontmatter, and provides templating settings to build websites. Currently, MyST site functionality is not available in the MyST cli.

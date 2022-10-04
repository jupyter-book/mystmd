---
title: Contribute a Template
description: Please consider sharing your jtex templates so others in the MyST community can make use of your work and potentially improve it. There is an API to list all templates, and when you contribute it, your template will show up in command line queries, like listing all `myst templates`.
---

MyST templates curates a community collection of MyST Markdown compatible templates. These templates allow MyST to export markdown files as typeset, formatted documents using PDF, LaTeX or Word. These templates expose data-driven options for customization ensuring the final documents comply with author submission guidelines provided by a particular journal, conference organizer or university.

To see all of the community templates use:

```bash
jtex list
# or
myst templates list --format tex
```

These will show you the list of community templates available, which are also possible to access through the MyST API, at https://api.myst.tools.

## List your Template

This guide outlines how to help your templates be discovered and used by the community, if you haven't yet created a template, see [](./create-a-latex-template.md) for more information.

Your template can stay in your GitHub organization:

1. add a `myst-template` tag to your GitHub repository
2. for the [templates](https://github.com/myst-templates/templates) repository and add your template information to the list

The `data` folder in <https://github.com/myst-templates/templates> has a list of templates:

```yaml
templates:
  - organization: username
    name: my_template
    source: https://github.com/username/my_template
    latest: main
```

Add your template to this list, and open a pull-request, (or use the GitHub interface to edit the file directly on the page).

Once a PR is opened, the MyST team will take a look and test out your template, and may give you some suggestions beyond what `myst check` can tell you.

## Donate your Template

In some cases it might make sense for the template to live as a community-curated template (e.g. it is for a major publication). You can [open an issue](https://github.com/myst-templates/templates/issues) to discuss if this makes sense.
If this is a path that we all decide, you can transfer the GitHub repository to `myst-templates`, and we will add you as a maintainer.

The main advantage of donating your template, is that there will be more people to help out with improvements, and when users use these templates, there will be no warnings raised about potentially untrusted code.

## Thanks!

Once your PR is merged, your template will be listed with `jtex list`, and accessible and discoverable by anyone who uses MyST Markdown!

Thanks for your contribution! 💚

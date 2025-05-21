---
title: Launch Jupyter sessions
---

If your source file is a Jupyter Notebook (`.ipynb`), you can add a button to your MyST website that launches a live Jupyter server in the cloud, and opens that content so they can edit and interact with it.[^thebe]

[^thebe]: This is a fully-interactive Jupyter environment. If you'd instead like like to provide interactivity to the same page, see [](./integrating-jupyter.md).

:::{caution} Launch buttons are experimental!
We are still learning the best UX and configuration to control launch buttons, so they may change in the future!
:::

## Add a Jupyter server launch button

To add a launch button to your project, ensure your project has GitHub configuration in your [project or page frontmatter](./frontmatter.md), then use the `project.jupyter: true` configuration. For example:

```yaml
project:
  github: jupyter-book/mystmd
  jupyter: true
```

This will add a "launch button" to the top of each page. Clicking the button will open a menu where you can paste in the URL of a JupyterHub or BinderHub to launch your content.
Here's what it looks like:

```{figure} ./images/launch-button-menu.png
:width: 75%
The launch button menu allows you to launch Jupyter servers on a JupyterHub or a Binder service. You can paste in the URL of the JupyterHub / BinderHub instance where you'd like to launch your content.
```

When you click {kbd}`Launch`, a Jupyter session will launch on the hub URL you've provided, and the source file of the current page will open.

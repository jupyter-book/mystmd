---
title: Contribution Guide
short_title: Contribution Guide
---

This page contains pointers and links to help you contribute to this project.

## Developer guide

Technical detail about project architecture and contributing code is given in the [developer guide](./developer.md)

## Our team compass

The [Jupyter Book Team Compass][compass] is a source of truth for our team structure and policy.
It also has a lot of information about how to contribute.

## Code of conduct

We expect all contributors to this project to [Code of Conduct][coc].

## Where we work

We do most of our work in GitHub repositories in [the `jupyter-book/` GitHub organization](https://github.com/jupyter-book).

Our [roadmap](https://github.com/orgs/jupyter-book/projects/1/views/1) provides a big picture overview of project initiatives.
[Current priorities](https://github.com/orgs/jupyter-book/projects/1/views/7) track work items that we would like to complete soon.
You will see these divided into two lists: "Priority" items (important and urgent) and "Side Quest" items (important, not urgent).
If you are unsure what to work on, we recommend you pick an item from one of these two lists.
These items are most likely to get an enthusiastic response, and will likely be reviewed quickly.

## Where we communicate

- For chat and real-time conversations: [The MyST community Discord server](https://discord.mystmd.org).
- For discussions around work and development: Issues in the `mystmd` repositories.
- For general discussions and questions: [the `mystmd` community forum](https://github.com/jupyter-book/mystmd/discussions).

## Relevant GitHub repositories

The `mystmd` project covers a _subset_ of the [`jupyter-book/` GitHub organization](https://github.com/jupyter-book).
It focuses on the JavaScript-based MyST Markdown engine and ecosystem, as well as the markdown syntax that MyST uses.

Below is a list of relevant repositories and a brief description of each.

- [mystmd](https://github.com/jupyter-book/mystmd): The MyST document engine and functionality not related to specific renderers.
- [myst-theme](https://github.com/jupyter-book/myst-theme): The web components and themes that are used for either the book or article themes for MyST.
- [myst-spec](https://github.com/jupyter-book/myst-spec): Questions about the markdown syntax for MyST and standardization efforts for MyST functionality.
- [jupyterlab-myst](https://github.com/jupyter-book/jupyterlab-myst): Questions about the JupyterLab extension for MyST.
- [MyST Templates](https://github.com/myst-templates): Repositories that contain templates for rendering MyST documents into various outputs like LaTeX, JATS, Typst, and Docx.

> [!NOTE]
> There are many repositories with similar functionality in the `executablebooks/` organization. Many of these are based around the [Sphinx documentation ecosystem](https://www.sphinx-doc.org). For example, the [MyST-NB repository](https://github.com/executablebooks/myst-nb) is a Sphinx extension for Jupyter notebooks, and the [MyST Parser repository](https://github.com/executablebooks/myst-parser) is a MyST markdown parser for Sphinx.

## Contribution workflow

Generally speaking, our contribution workflow looks something like this:

- **Conduct free-form conversation and brainstorming in our forum**. We have [a community forum](https://github.com/jupyter-book/mystmd/discussions) for general discussion that does not necessarily require a change to our code or documentation. If you have a specific enhancement or bug you would like to propose for resolution, see the next steps.
- **Search open issues to see if your idea is already discussed**. Use [a GitHub search in the `jupyter-book/` organization](https://github.com/search?q=org:jupyter-book%20&type=code) to see if you should add to an existing issue or create a new one. If you don't think an issue exists that covers your idea or bug, go ahead and open one.
- **Discuss and propose changes in issues**. Issues are a way for us to agree on a problem to solve, and align on a way to solve it. They should invite broad feedback and be as explicit as possible when making formal proposals.
- **Make a pull request to implement an idea**. We use Pull Requests to formally propose changes to our code or documentation. These generally point to an issue and ideally will close it.
- **Iterate on the pull request and merge**. Pull Requests should have discussion and feedback from at least one core team member, and ideally from many. Once the PR is ready to merge, a core team member may decide to do so. See [our decision-making guide for formal details][governance].

This describes the high-level process that is usually followed.
In practice, we recommend attempting a contribution to get a feel for how it works in practice.

## How our team is structured

Our [Team page][team] lists all of the teams in the `jupyter-book/` organization and their members.
In addition, [our Governance page][governance] describes the responsibilities and authority that team members have.

## How we make decisions

Our [governance page][governance] describes our formal decision-making processes.

[compass]: https://compass.jupyterbook.org
[coc]: https://compass.jupyterbook.org/code-of-conduct
[team]: https://compass.jupyterbook.org/team
[governance]: https://compass.jupyterbook.org/team
[decisions]: https://compass.jupyterbook.org/team

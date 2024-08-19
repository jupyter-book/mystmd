---
title: Guiding principles of MyST
description: A collection of ideas that helps guide the direction and decisions of the MyST ecosystem of tools.
---

This document describes some high-level principles that the MyST community follows in designing technology and deciding where we are going.
It is meant to align our team on the big ideas guiding the project, and provide visibility to others for the impact we're trying to have and where we are heading.


:::{note} This will evolve!
Our guiding principles are a constant work-in-progress, and will evolve as the community better-understands its opportunities and goals.
:::

## Who is MyST for and what problem does MyST try to solve? 

MyST builds composable tools and standards for people that communicate technical and computational narratives. These people need to communicate _throughout_ the lifecycle of discovery and learning, both within their local networks and to broader communities. Below are several key problems that MyST aims to solve for this group:

**Communicating with data:** These problems apply to data scientists in general.

- There is no document standard and engine that is well-defined, broadly adopted, and integrated with modern data science workflows. This results in a variety of formats for communication, which introduces friction to learning and re-using other people’s ideas and data.
- Tools for interactive computing (like Jupyter Notebooks or JupyterLab) focus primarily on data exploration and discovery. Tools specifically designed for authoring and reading tend to be created by different communities, and thus do not integrate with data science workflows. 
- Tools for communicating tend to have strong assumptions about the output format (e.g. HTML or PDF) or about the use-case (e.g., publishing in peer-reviewed journals vs. collectively-written documentation), which leads to workflow-specific tools that are not interoperable.

**Scholarly publishing:** Because of the scholarly community’s unique relationship with journals, we define several problems unique to this area that we design for:

- The publishing ecosystem is fractured, with a variety of formats and technology standards primarily focused on print-based mediums (e.g. PDFs). Authors lose time reformatting their content according to publisher needs, and static mediums do not well represent computational data.
- Tools for publishing and communication are often distinct from the tools used for exploration and analysis. This makes it harder for computation to inform the scholarship, and creates artificial barriers between the analyses that define and reproduce ideas, and the scholarship that describes ideas.
- Publishing systems are strongly linked to large-scale publishers, and do not optimize for accessible re-use of content. This makes it harder for researchers to learn and re-use one another's ideas.


## How does MyST uniquely solve this problem?

_What's the approach MyST takes that uniquely solves the problem(s) above? For example:_

- **Provide a reusable Source of Truth.** Define a "source of truth" document structure that is the primary output of MyST's build engine, and that can be flexibly rendered into many output formats.
- **Computation is a first class citizen.** Define a document standard that treats computational elements as first-class citizens, and provides an excellent web-native interface, allowing authors to bring their ideas to life with interactive computation.
- **Continuous communication throughout the data science lifecycle.** Build on pre-existing community standards for computational analysis, to ensure interoperability with pre-existing workflows and to allow users to communicate _via_ these workflows rather than adopting significant new ones. We integrate with the Jupyter ecosystem because it is an industry standard in interactive computing for data exploration and discovery. 
- **Extension points and customization get users over the last mile.** Don’t design MyST for specific scientific domains or questions, and provide tools that are broadly useful and composable. Create tools and standards that facilitate interoperability and enable customization so that users can extend MyST’s functionality for their specific needs.
- **Community-led tools and standards.** MyST should be led by its community in order to ensure it continues to represent the interests of its community members, and is not driven by a single stakeholder or organization.

**Design principles to promote a rich and interconnected scientific commons.**

- **Promote open science practices via good UX.** As a general guiding principle, encourage users to adopt best practices by removing friction, offering an excellent user experience, and incentivizing them with useful functionality. Assume users will use what gives them the best experience and features, and bring open science workflows throughout.
- **Pull for reproducibility through interactivity.** Build compelling ways for researchers to integrate computation into their narratives; this interactivity requires reproducible practices to be adopted and maintained.
- **Adding metadata and links creates immediate value.** We design features that encourage and showcase additional information when authors provide valuable metadata (DOIs, ORCIDs, RORs) as well as cross-reference other resources. For example, by pulling in references dynamically and providing rich hover information and contextual information.
- **Data should be easier to add than markup.** Given the choice of, for example, writing a text only reference in APA style or adding a single markdown link to a DOI, encourage authors to choose to work with data and linked metadata services. Our tools should encourage and reinforce using data as the primary source of information.
- **Bring contextual information to the reading experience.** The user interfaces we design should promote bringing information, such as equations, figures, abbreviations, citations, or terms and visualizations from another project directly into the reading experience. This design principle reinforces the community, standards-based ecosystem that we are curating.

## What does success look like for MyST?

We imagine a future where MyST is an industry-wide standard for communicating with computational narratives that provides a single toolchain for researchers to communicate their ideas wherever they wish.

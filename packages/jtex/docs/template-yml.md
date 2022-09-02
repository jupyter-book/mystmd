---
title: Template.yml
---

Every template defines a `template.yml` to define the options the template exposes and metadata of the authorship and license of the template.

## Metadata

The `metadata` section of the `template.yml` defines the information about the template it's self, including who made it, the license, any tags for the template and links to the source repositories.

This information is meant for listing and searching templates in a user interface.
For example, on `curvenote` a list of the template information looks like:

```{figure} ./images/template-listing.png
A user interface making use of the `template.yml` metadata fields.
```

### Metadata Fields

The following metadata fields should be included for the template to be attributed correctly.

```yaml
metadata:
  title: Title of the Template
  description: A minimal template that only uses vanilla LaTeX commands and environments
  version: 1.0.0
  license: CC-BY-4.0
  author:
    name: Journal 42
    github: github_handle
    twitter: twitter_handle
    affiliation: Big Science
  contributor:
    name: Contributor Name
    github: github_handle
    twitter: twitter_handle
    affiliation: Optional
  tags:
    - article
    - two-column
  links:
    github: https://github.com/curvenote/templates
    source: https://curvenote.com
```

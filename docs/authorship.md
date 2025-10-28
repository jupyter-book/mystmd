# Authorship and attribution

A MyST project can include metadata about the authors of each page, such as institutional affiliations, funding sources, etc.

## How to set author information

Author information is set with [MyST frontmatter](./frontmatter.md).
You can set this either in **`myst.yml`** (in which case, they will apply to all documents in a MyST project), or in the **page frontmatter** (in which case they'll just apply to that page).

For example, the examples below show frontmatter for authors and [author affiliations](#affiliations) in frontmatter of an `article.md` file, and in `myst.yml`:

::::{tab-set}
:::{tab-item} article.md

```yaml
---
title: My Article
authors:
  - name: Marissa Myst
    affiliation: ubc
  - name: Miles Mysterson
    affiliations: ubc; stanford
---

My article text begins here...
```

:::
:::{tab-item} myst.yml

```yaml
affiliations:
  - id: ubc
    institution: University of British Columbia
    ror: https://ror.org/03rmrcq20
    isni: 0000 0001 2288 9830
    department: Department of Earth, Ocean and Atmospheric Sciences
    address: 2020 – 2207 Main Mall
    city: Vancouver
    region: British Columbia
    country: Canada
    postal_code: V6T 1Z4
    phone: 604 822 2449
  - id: stanford
    name: ...
```

:::
::::

See [the `authors` frontmatter reference](#frontmatter:authors) for a list of all authorship metadata fields you can use.

### Re-use author information across repositories and projects

By [extending MyST configuration files](#composing-myst-yml) you can store author information in one place and re-use it across many other locations.
This allows you to define a source of truth for authorship and affiliations, and reference that over time. For example:

In one file, you'd define all the author affiliations that are relevant to your project:

```{code-block} yaml
:filename: authors.yml
version: 1
project:
  contributors:
    - id: person_a
      name: First Last
      email: person_a@org_a.org
      orcid: XXXX-XXXX-XXXX-XXXX
      github: person_a
      affiliations:
        - id: org_a
        - id: org_b
    - id: person_b
      name: First Last
      email: person_b@org_b.com
      orcid: XXXX-XXXX-XXXX-XXXX
      github: person_b
      affiliations:
        - id: org_b
  affiliations:
    - id: org_a
      name: Organization A Incorporated
    - id: org_b
      name: Org B Inc.
```

And in each of your project `myst.yml` files, you can extend this authorship file like so to include all the information:

```{code-block} yaml
:filename: myst.yml
version: 1
extends:
  - ./authors.yml  # Or, the URL of this file if not hosted locally
project:
  authors:
    - person_a
    - person_b
```

You could then also reference these authors in your page frontmatter like so:

```{code-block} markdown
:filename: mypage.md
---
authors:
- person_a
---

Page content...
```

(affiliations)=
## Affiliations

You can create an affiliation directly by adding it to an author.
It can be as simple as a single string.

```yaml
authors:
  - name: Marissa Myst
    affiliation: University of British Columbia
```

You can also add much more information to any affiliation, such as a ROR, ISNI, or an address.
A very complete affiliations list for an author at the University of British Columbia is:

```yaml
authors:
  - name: Marissa Myst
    affiliations:
      - id: ubc
        institution: University of British Columbia
        ror: https://ror.org/03rmrcq20
        isni: 0000 0001 2288 9830
        department: Department of Earth, Ocean and Atmospheric Sciences
        address: 2020 – 2207 Main Mall
        city: Vancouver
        region: British Columbia
        country: Canada
        postal_code: V6T 1Z4
        phone: 604 822 2449
        bluesky: '@eoas.ubc.ca'
  - name: Miles Mysterson
    affiliation: ubc
```

Notice how you can use an `id` to avoid writing this out for every coauthor.
Additionally, if the affiliation is a single string and contains a semi-colon `;` it will be treated as a list.

If you use a string that is not recognized as an already defined affiliation in the project or article frontmatter, an affiliation will be created automatically and normalized so that it can be referenced:

::::{tab-set}
:::{tab-item} Written Frontmatter

```yaml
authors:
  - name: Marissa Myst
    affiliations:
      - id: ubc
        institution: University of British Columbia
        ror: 03rmrcq20
        department: Earth, Ocean and Atmospheric Sciences
      - ACME Inc
  - name: Miles Mysterson
    affiliation: ubc
```

:::
:::{tab-item} Normalized

```yaml
authors:
  - name: Marissa Myst
    affiliations: ['ubc', 'ACME Inc']
  - name: Miles Mysterson
    affiliations: ['ubc']
affiliations:
  - id: ubc
    institution: University of British Columbia
    ror: https://ror.org/03rmrcq20
    department: Earth, Ocean and Atmospheric Sciences
  - id: ACME Inc
    name: ACME Inc
```

:::
::::

See [the frontmatter affiliations table](#table-frontmatter-affiliations) for a complete list of the affiliations metadata you can use.

## Add social media links 

You can add social media links to authors and affiliations.
To do so, use the following fields in an entry for either `author` or the `affiliation`:

![](#table-frontmatter-social-links)

(other-contributors)=
## Reviewers, Editors, Funding Recipients

Other contributors besides authors may be listed elsewhere in the frontmatter.
These include `reviewers`, `editors`, and [funding](#frontmatter:funding) award `investigators` and `recipients`.
For all of these fields, you may use a full [author object](#frontmatter:authors), or you may use the string `id` from an existing author object defined elsewhere in your frontmatter.

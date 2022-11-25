# jats-xml

Types and utilities for working with JATS XML documents in Node and Typescript.

Read and write JATS XML from node or see summries from the command line.

To use from the command line, use the `-g` to create a global install, which will provide a `jats` CLI:

```
npm install -g jats-xml
jats -v
```

## What is JATS?

JATS is a NISO standard for Journal Article Tags Schema, which is a way to define the XML structure of a scientific article semantically. This includes the `front`-matter (authors, funding, title, abstract, etc.), the `body` of the article (sections, figures, equations, tables, etc.), and `back`-matter (references, footnotes, etc.). The JATS can also contain `sub-articles`.

The standard documents are hosted by the NIH <https://jats.nlm.nih.gov/>. There are three flavours, this library currently uses in most cases the most precriptive tag set (for article authoring). Another helpful resource is <https://jats4r.org/>, which provides other examples and recomendations for JATS.

Note that most publishers do **not** provide the XML as a first class output - they should, it is an important part of open-science to have the content programatically accessible and interoperable. It is only [FAIR](https://www.go-fair.org/fair-principles/) 😉.

## From the command line

Commands available:

`download`: attempt to find the JATS file and download it locally.

```bash
jats download https://docs.python.org/3.7 article.jats
```

Note, currently this just downloads the XML, **not** the associated files.

`sumamry`: summarize the contents of the JATS, given a URL, DOI, or local file

```bash
jats summary https://elifesciences.org/articles/81952
jats summary 10.1371/journal.pclm.0000068
jats summary /local/article.jats
```

This will provide a summary, including a list of what the JATS file contains.

![Output of `jats summary`](images/jats-output.png)

## Working in Typescript

All tags are accessible as types/enums. There is also documentation from each node-type

```typescript
import { Tags } from 'jats-xml';

Tags.journalId;
```

## Reading JATS in Node

```typescript
import 'fs' from 'fs';
import { Inventory, toDate } from 'jats-xml';
import { toText } from 'myst-common';
import { select, selectAll } from 'unist-util-select';

const data = fs.readFileSync('article.jats').toString();
const jats = new JATS(data);
// Easy access to properties
jats.doi
jats.body // A tree of the body (or front/back)
toDate(jats.publicationDate) // as a Javascript Date object
select('[id=fig1]', jats.body) // select a figure by an ID
selectAll('fig', jats.body) // Or selectAll figures
```

## Write JATS in Node

TODO!

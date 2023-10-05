---
title: Working with JATS
description: MyST can be used to create JATS (Journal Article Tag Suite), a NISO standard that is widely used in scientific publishing.
---

In the context of open access scientific publishing, it is common[^openaccessjats] that the Version of Record (VoR) includes the full text of the article as well as figures and tables. Scientific metadata about an article is no longer just the abstract, authors, and references. This full text, structured data that is permissively licensed will open up many workflows for scientific research. The full text is most often stored in an XML format which can be used to create all other views of this content (PDF, HTML). The structure of this XML varies between publisher, with the most used open standard being JATS ([Journal Article Tag Suite](https://jats.nlm.nih.gov/)), a [NISO standard](https://www.niso.org/standards-committees/jats).

[^openaccessjats]: PubMedCentral has about 8.5 million full-text articles in JATS. There are currently 5.8 million works with full-text XML available through CrossRef, for example. See [CrossRef’s API](https://api.crossref.org/works?filter=full-text.type:application/xml,full-text.application:text-mining&facet=publisher-name:*&rows=0).

[JATS](https://jats.nlm.nih.gov) defines a set of XML elements and attributes designed to represent journal articles in a single standard XML format. A JATS document is a single XML file that includes an `article`, which has `front` matter (authors, affiliations, title, abstract, funding), the `body` of the article (all sections, text, references to figures/images, tables), and the `back` matter (appendix sections, data-availability statements, conflict statements, acknowledgments, and the reference list). There can also be a number of `sub-article`s (with their own stubbed, frontmatter) that can be used to store other documents in a project (reviews, responses, appendices, or even computational notebooks!).

MyST can be used to both download, read, create the full JATS XML, using our tool called `jats-xml` (see [install instructions](https://www.npmjs.com/package/jats-xml)). To download a JATS file, for example, you can use the command-line interface:

```bash
jats download https://elifesciences.org/articles/81952 article.jats
```

You can also summarize a JATS article, either locally or remotely using a DOI or some URLs.

```bash
jats summary https://elifesciences.org/articles/81952
```

```{figure} images/jats-output.png
Summarize the contents of the JATS, given a URL, DOI, or local file. This will list the various components, and can be read by MyST.
```

## JATS for Journal Archiving and Interchange

There are three different tag-sets for JATS, as a lot of the content that we are aiming to work with requires computational notebooks and multiple articles we have chosen to focus MyST on the Journal Archiving and Interchange (v1.3). There is a lot of overlap between the tag-sets, with the Journal Archiving and Interchange tag-set being the most permissive and allowing, for example, `sub-articles`. Try clicking the "JATS" button in the following demo.

```{myst}
---
numbering: | # This has to be a string for now, sillyness in the docutils clone
  heading_3: true
  enumerator: 5.3.%s
---

(jats-sec)=
### Looking at JATS

JATS body content is XML: **strong**, _emphasis_, with cross-references ([Sec. %s](#jats-sec)) as an `xref`.
```

The largest structural difference in body content is that the sections (`sec`) are nested, which are accomplished as specific transforms for this export target.

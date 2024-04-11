---
export:
  - output: _build/out.tex
    template: ../templates/tex
    format: tex
---

# DOI tests

Bibtex citation with doi: @Vogel2018systemic

Bibtex citation without doi: @Meurer2020framework

Bibtex book citation: @RN1

Normal DOI citation: [](https://doi.org/10.1111/j.1365-246X.2012.05497.x)

Nonexistent DOI citation (errors!): [](https://doi.org/10.1111/j.1365-246X.2012.99999.x)

DOI with with invalid BibTeX: [](10.2903/j.efsa.2019.5779)

DOI with with invalid BibTeX as cite node: @10.2903/j.efsa.2019.5779

DOI with some strange characters: [](https://doi.org/10.1002/(SICI)1096-987X(199709)18:12%3C1450::AID-JCC3%3E3.0.CO;2-I)

Short DOI: [](https://doi.org/cr3qwn)
import fs from 'fs';
import { toText } from 'myst-common';
import { select } from 'unist-util-select';
import { Jats } from '../src';
import { Tags } from '../src/types';
import { authorAndAffiliation, formatDate, toDate } from '../src/utils';

describe('Basic JATS read', () => {
  test('read elife JATS', () => {
    // https://elifesciences.org/articles/80919.xml
    const data = fs.readFileSync('tests/elifeExample.xml').toString();
    const jats = new Jats(data);
    expect(jats.doi).toEqual('10.7554/eLife.80919');
    expect(formatDate(toDate(jats.publicationDate))).toEqual('September 26, 2022');
    expect(jats.body?.children.length).toEqual(4);
    expect(jats.subArticles.length).toEqual(3);
    expect(jats.refList?.children.length).toEqual(69);
    expect(jats.references.length).toEqual(68); // There is one less, because there is a title!
    expect(jats.references[0].id).toEqual('bib1');
    expect(toText(jats.articleTitle)).toEqual(
      'Differential requirements for mitochondrial electron transport chain components in the adult murine liver',
    );
    expect(jats.articleSubtitle).toBeUndefined();
    expect(toText(jats.abstract)).toBe(
      'Mitochondrial electron transport chain (ETC) dysfunction due to mutations in the nuclear or mitochondrial genome is a common cause of metabolic disease in humans and displays striking tissue specificity depending on the affected gene. The mechanisms underlying tissue-specific phenotypes are not understood. Complex I (cI) is classically considered the entry point for electrons into the ETC, and in vitro experiments indicate that cI is required for basal respiration and maintenance of the NAD+/NADH ratio, an indicator of cellular redox status. This finding has largely not been tested in vivo. Here, we report that mitochondrial complex I is dispensable for homeostasis of the adult mouse liver; animals with hepatocyte-specific loss of cI function display no overt phenotypes or signs of liver damage, and maintain liver function, redox and oxygen status. Further analysis of cI-deficient livers did not reveal significant proteomic or metabolic changes, indicating little to no compensation is required in the setting of complex I loss. In contrast, complex IV (cIV) dysfunction in adult hepatocytes results in decreased liver function, impaired oxygen handling, steatosis, and liver damage, accompanied by significant metabolomic and proteomic perturbations. Our results support a model whereby complex I loss is tolerated in the mouse liver because hepatocytes use alternative electron donors to fuel the mitochondrial ETC.',
    );
    expect(jats.abstracts.length).toBe(2);
    expect(jats.abstracts[1]['abstract-type']).toBe('plain-language-summary');
    expect(jats.keywords.length).toBe(3);
    expect(jats.keywordGroups.length).toBe(2); // There may be multiple keyword groups!
    expect(
      jats.keywords
        .filter((t) => t.type === Tags.kwd)
        .map(toText)
        .join(','),
    ).toBe('mitochondria,liver,Complex I');

    // Can select based on IDs!
    expect(select('[id=fig1]', jats.body)?.type).toBe('fig');
    // Authors
    expect(jats.contribGroup?.children.length).toBe(18);
    expect(jats.articleAuthors.length).toBe(12);
    expect(toText(select(Tags.surname, jats.articleAuthors[0]))).toBe('Lesner');
    expect(toText(select(Tags.surname, jats.articleAuthors[11]))).toBe('Mishra');
    const author = authorAndAffiliation(jats.articleAuthors[0], jats.tree);
    expect(author.name).toBe('Nicholas P Lesner');
    expect(author.orcid).toBe('0000-0001-9734-8828');
    expect(author.affiliations?.length).toBe(1);
    expect(author.affiliations?.[0]).toBe(
      "Children's Medical Center Research Institute, University of Texas Southwestern Medical Center",
    );
    expect(jats.license?.['xlink:href']).toBe('http://creativecommons.org/licenses/by/4.0/');
  });
  test('read plos JATS', () => {
    // https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000068&type=manuscript
    // The XML is here:
    // https://journals.plos.org/climate/article/file?id=10.1371/journal.pclm.0000068&type=manuscript
    const data = fs.readFileSync('tests/plosExample.xml').toString();
    const jats = new Jats(data);
    expect(jats.doi).toEqual('10.1371/journal.pclm.0000068');
    expect(formatDate(toDate(jats.publicationDate))).toEqual('September 6, 2022');
    expect(jats.body?.children.length).toEqual(4);
    expect(jats.subArticles.length).toEqual(0);
    expect(jats.refList?.children.length).toEqual(147);
    expect(jats.references.length).toEqual(146); // There is one less, because there is a title!
    expect(jats.references[0].id).toEqual('pclm.0000068.ref001');
    expect(toText(jats.articleTitle)).toEqual(
      'Dynamic Global Vegetation Models: Searching for the balance between demographic process representation and computational tractability',
    );
    expect(jats.articleSubtitle).toBeUndefined();
    expect(toText(jats.abstract)).toBe(
      'Vegetation is subject to multiple pressures in the 21st century, including changes in climate, atmospheric composition and human land-use. Changes in vegetation type, structure, and function also feed back to the climate through their impact on the surface-atmosphere fluxes of carbon and water. Dynamic Global Vegetation Models (DGVMs), are therefore key component of the latest Earth System Models (ESMs). Model projections for the future land carbon sink still span a wide range, in part due to the difficulty of representing complex ecosystem and biogeochemical processes at large scales (i.e. grid lengths ≈ 100km). The challenge for developers of DGVMs is therefore to find an optimal balance between detailed process representation and the ability to scale-up. We categorise DGVMs into four groups; Individual, Average Area, Two Dimensional Cohort and One Dimensional Cohort models. From this we review popular methods used to represent dynamic vegetation within the context of Earth System modelling. We argue that the minimum level of complexity required to effectively model changes in carbon storage under changing climate and disturbance regimes, requires a representation of tree size distributions within forests. Furthermore, we find that observed size distributions are consistent with Demographic Equilibrium Theory, suggesting that One Dimensional Cohort models with a focus on tree size, offer the best balance between computational tractability and realism for ESM applications.',
    );
    expect(jats.abstracts.length).toBe(1);
    expect(jats.keywordGroups.length).toBe(0);
    expect(jats.keywords.length).toBe(0);
    expect(jats.license?.['xlink:href']).toBe('http://creativecommons.org/licenses/by/4.0/');

    // Authors
    expect(jats.articleAuthors.length).toBe(3);
    expect(toText(select(Tags.surname, jats.articleAuthors[0]))).toBe('Argles');
    expect(toText(select(Tags.surname, jats.articleAuthors[2]))).toBe('Cox');
  });
});

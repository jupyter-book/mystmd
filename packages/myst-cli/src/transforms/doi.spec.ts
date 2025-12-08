import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { resolveDOIAsBibTeX, resolveDOIAsCSLJSON } from './dois';

const PRIESTLEY_1972_CSL_JSON = [
  {
    'container-title': 'Monthly Weather Review',
    author: [
      { given: 'C. H. B.', family: 'PRIESTLEY' },
      { given: 'R. J.', family: 'TAYLOR' },
    ],
    DOI: '10.1175/1520-0493(1972)100<0081:otaosh>2.3.co;2',
    type: 'article-journal',
    issue: '2',
    issued: { 'date-parts': [[1972, 2]] },
    page: '81-92',
    publisher: 'American Meteorological Society',
    title: 'On the Assessment of Surface Heat Flux and Evaporation Using Large-Scale Parameters',
    volume: '100',
  },
];

const BARTELS_1997_CSL_JSON = [
  {
    DOI: '10.1002/(sici)1096-987x(199709)18:12<1450::aid-jcc3>3.0.co;2-i',
    // ISSN: '0192-8651',
    // URL: 'http://dx.doi.org/10.1002/(SICI)1096-987X(199709)18:12<1450::AID-JCC3>3.0.CO;2-I',
    author: [
      {
        family: 'Bartels',
        given: 'Christian',
      },
      {
        family: 'Karplus',
        given: 'Martin',
      },
    ],
    'container-title': 'Journal of Computational Chemistry',
    issue: '12',
    issued: {
      'date-parts': [[1997, 9]],
    },
    page: '1450-1462',
    publisher: 'Wiley',
    title:
      'Multidimensional adaptive umbrella sampling: Applications to main chain and side chain peptide conformations',
    type: 'article-journal',
    volume: '18',
  },
];
describe.each([
  { resolver: resolveDOIAsBibTeX, name: 'BibTeX' },
  { resolver: resolveDOIAsCSLJSON, name: 'CSL-JSON' },
])('DOI Resolvers for $name', ({ resolver, name }) => {
  it('short DOI resolves', async () => {
    const data = await resolver(new Session(), 'https://doi.org/cr3qwn');
    expect(data).toMatchObject(PRIESTLEY_1972_CSL_JSON);
  });
  it('url encoded DOI resolves', async () => {
    const data = await resolver(
      new Session(),
      'https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2',
    );
    expect(data).toMatchObject(PRIESTLEY_1972_CSL_JSON);
  });
  it('markdown link with strange characters resolves', async () => {
    const data = await resolver(
      new Session(),
      'https://doi.org/10.1175/1520-0493(1972)100<0081:OTAOSH>2.3.CO;2',
    );
    expect(data).toMatchObject(PRIESTLEY_1972_CSL_JSON);
  });
  it('markdown link with strange characters resolves', async () => {
    const data = await resolver(
      new Session(),
      'https://doi.org/10.1002/(SICI)1096-987X(199709)18:12%3C1450::AID-JCC3%3E3.0.CO;2-I',
    );
    // Both of these are different depending on the resolver
    // The URL is encoded, the ISSN is actually different?!
    delete data?.[0].URL;
    delete data?.[0].ISSN;
    expect(data).toMatchObject(BARTELS_1997_CSL_JSON);
  });
});

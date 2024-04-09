import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { resolveDoiAsBibTeX, resolveDoiAsCSLJSON } from './dois';

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
describe.each([
  { resolver: resolveDoiAsBibTeX, name: 'BibTeX' },
  { resolver: resolveDoiAsCSLJSON, name: 'CSL-JSON' },
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
});

import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { getDoiOrgBibtex } from './dois';

const PRIESTLEY_1972 =
  '@article{PRIESTLEY_1972, title={On the Assessment of Surface Heat Flux and Evaporation Using Large-Scale Parameters}, volume={100}, ISSN={1520-0493}, url={http://dx.doi.org/10.1175/1520-0493(1972)100<0081:OTAOSH>2.3.CO;2}, DOI={10.1175/1520-0493(1972)100<0081:otaosh>2.3.co;2}, number={2}, journal={Monthly Weather Review}, publisher={American Meteorological Society}, author={PRIESTLEY, C. H. B. and TAYLOR, R. J.}, year={1972}, month=feb, pages={81–92} }';
describe('DOI Resolvers', () => {
  it('short DOI resolves', async () => {
    const bibtex = await getDoiOrgBibtex(new Session(), 'https://doi.org/cr3qwn');
    expect(bibtex?.trim()).toEqual(PRIESTLEY_1972);
  });
  it('url encoded DOI resolves', async () => {
    const bibtex = await getDoiOrgBibtex(
      new Session(),
      'https://doi.org/10.1175%2F1520-0493%281972%29100%3C0081%3AOTAOSH%3E2.3.CO%3B2',
    );
    expect(bibtex?.trim()).toEqual(PRIESTLEY_1972);
  });
  it('markdown link with strange characters resolves', async () => {
    const bibtex = await getDoiOrgBibtex(
      new Session(),
      'https://doi.org/10.1175/1520-0493(1972)100<0081:OTAOSH>2.3.CO;2',
    );
    expect(bibtex?.trim()).toEqual(PRIESTLEY_1972);
  });
});

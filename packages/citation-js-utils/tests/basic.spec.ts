import { describe, expect, it } from 'vitest';
import { getCitations, CitationJSStyles } from '../src';
import {
  bibtex,
  doiInNote,
  doiInURL,
  TEST_APA_HTML,
  TEST_DOI_IN_OTHER_FIELD,
  TEST_VANCOUVER_HTML,
} from './fixtures';

const key = 'Cockett2015SimPEG';

describe('Test reference rendering', () => {
  it('APA', async () => {
    const citations = await getCitations(bibtex);
    expect(Object.keys(citations).length).toBe(1);
    const cite = citations[key];
    expect(cite.render()).toEqual(TEST_APA_HTML);
    expect(cite.render(CitationJSStyles.apa)).toEqual(TEST_APA_HTML);
    expect(cite.getDOI()).toEqual('10.1016/j.cageo.2015.09.015');
  });
  it('Vancouver', async () => {
    const citations = await getCitations(bibtex);
    const cite = citations[key];
    expect(cite.render(CitationJSStyles.vancouver)).toEqual(TEST_VANCOUVER_HTML);
  });
  it.each([
    ['url', doiInURL],
    ['note', doiInNote],
  ])('Extract the DOI from the %s', async (_, src) => {
    const citations = await getCitations(src);
    expect(citations['cury2020sparse'].getDOI()).toBe(TEST_DOI_IN_OTHER_FIELD);
  });
});

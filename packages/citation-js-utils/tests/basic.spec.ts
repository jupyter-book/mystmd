import { describe, expect, it } from 'vitest';
import {
  getCitationRenderers,
  parseBibTeX,
  CitationJSStyles,
  yearFromCitation,
  firstNonDoiUrl,
} from '../src';
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
    const data = parseBibTeX(bibtex);
    const citations = getCitationRenderers(data);
    expect(Object.keys(citations).length).toBe(1);
    const cite = citations[key];
    expect(cite.render()).toEqual(TEST_APA_HTML);
    expect(cite.render(CitationJSStyles.apa)).toEqual(TEST_APA_HTML);
    expect(cite.getDOI()).toEqual('10.1016/j.cageo.2015.09.015');
  });
  it('Vancouver', async () => {
    const data = parseBibTeX(bibtex);
    const citations = getCitationRenderers(data);
    const cite = citations[key];
    expect(cite.render(CitationJSStyles.vancouver)).toEqual(TEST_VANCOUVER_HTML);
  });
  it.each([
    ['url', doiInURL],
    ['note', doiInNote],
  ])('Extract the DOI from the %s', async (_, src) => {
    const data = parseBibTeX(src);
    const citations = getCitationRenderers(data);
    expect(citations['cury2020sparse'].getDOI()).toBe(TEST_DOI_IN_OTHER_FIELD);
    expect(citations['cury2020sparse'].getURL()).toBe(`https://doi.org/${TEST_DOI_IN_OTHER_FIELD}`);
  });
});

describe('yearFromCitation', () => {
  it('date-parts year is returned', async () => {
    const data = { id: 'id', issued: { 'date-parts': [[2020, 1, 1]] } };
    expect(yearFromCitation(data)).toEqual(2020);
  });
  it('date-parts year is prioritized', async () => {
    const data = { id: 'id', issued: { 'date-parts': [[2020, 1, 1]], literal: '1999' } };
    expect(yearFromCitation(data)).toEqual(2020);
  });
  it('literal is used', async () => {
    const data = { id: 'id', issued: { literal: '2020' } };
    expect(yearFromCitation(data)).toEqual('2020');
  });
  it('literal is parses from string', async () => {
    const data = { id: 'id', issued: { literal: 'Accessed 2020 Jan 1' } };
    expect(yearFromCitation(data)).toEqual('2020');
  });
  it('literal is parses from string with comma', async () => {
    const data = { id: 'id', issued: { literal: 'Accessed 2020, Jan 1' } };
    expect(yearFromCitation(data)).toEqual('2020');
  });
  it('literal is does not parse longer number', async () => {
    const data = { id: 'id', issued: { literal: 'Accessed 202020' } };
    expect(yearFromCitation(data)).toEqual('n.d.');
  });
  it('literal is does not parse as part of word', async () => {
    const data = { id: 'id', issued: { literal: 'Accessed a2020' } };
    expect(yearFromCitation(data)).toEqual('n.d.');
  });
  it('no date returns n.d.', async () => {
    const data = { id: 'id' };
    expect(yearFromCitation(data)).toEqual('n.d.');
  });
});

describe('firstNonDoiUrl', () => {
  it('no url returns undefined', async () => {
    expect(firstNonDoiUrl('my citation', 'abc123')).toEqual(undefined);
  });
  it('one url returns url', async () => {
    expect(firstNonDoiUrl('my citation https://example.com', 'abc123')).toEqual(
      'https://example.com',
    );
  });
  it('two urls returns first url', async () => {
    expect(
      firstNonDoiUrl('my citation https://example.com/a and https://example.com/b', 'abc123'),
    ).toEqual('https://example.com/a');
  });
  it('doi urls is skipped', async () => {
    expect(firstNonDoiUrl('my citation https://example.com/abc123', 'abc123')).toEqual(undefined);
  });
  it('url after doi url is returned', async () => {
    expect(
      firstNonDoiUrl('my citation https://example.com/abc123 and https://example.com/b', 'abc123'),
    ).toEqual('https://example.com/b');
  });
});

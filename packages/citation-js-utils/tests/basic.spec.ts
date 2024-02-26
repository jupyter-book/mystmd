import { describe, expect, it } from 'vitest';
import { getCitations, CitationJSStyles, yearFromCitation } from '../src';
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

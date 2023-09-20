import { describe, expect, it } from 'vitest';
import MarkdownIt from 'markdown-it';
import { citationsPlugin } from '../src/citations';

describe('parses citations', () => {
  it('basic in-text citation', () => {
    const mdit = MarkdownIt().use(citationsPlugin);
    const tokens = mdit.parse('In @simpeg2015, the authors...', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual(['text', 'cite', 'text']);
    expect(tokens[1].content).toEqual('In @simpeg2015, the authors...');
    expect(tokens[1].children?.[0].content).toEqual('In ');
    expect(tokens[1].children?.[1].content).toEqual('@simpeg2015');
    expect(tokens[1].children?.[2].content).toEqual(', the authors...');
    const citation = tokens[1].children?.[1];
    expect(citation?.meta.label).toEqual('simpeg2015');
    expect(citation?.meta.kind).toEqual('narrative');
    expect(citation?.meta.prefix).toEqual(undefined);
    expect(citation?.meta.suffix).toEqual(undefined);
  });
  it('complex in-text citation', () => {
    const mdit = MarkdownIt().use(citationsPlugin);
    const tokens = mdit.parse('In @simpeg2015 [pg 23], the authors...', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual(['text', 'cite', 'text']);
    expect(tokens[1].content).toEqual('In @simpeg2015 [pg 23], the authors...');
    expect(tokens[1].children?.[0].content).toEqual('In ');
    expect(tokens[1].children?.[1].content).toEqual('@simpeg2015 [pg 23]');
    expect(tokens[1].children?.[2].content).toEqual(', the authors...');
    const citation = tokens[1].children?.[1];
    expect(citation?.meta.label).toEqual('simpeg2015');
    expect(citation?.meta.kind).toEqual('narrative');
    expect(citation?.meta.prefix).toEqual(undefined);
    expect(citation?.meta.suffix[0].content).toEqual('pg 23');
  });
  it('basic cite-group', () => {
    const mdit = MarkdownIt().use(citationsPlugin);
    const tokens = mdit.parse('...geophysical inversions [@simpeg2015; @heagy2017].', {});
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'cite_group_open',
      'cite',
      'cite',
      'cite_group_close',
      'text',
    ]);
    expect(tokens[1].content).toEqual('...geophysical inversions [@simpeg2015; @heagy2017].');
    expect(tokens[1].children?.[0].content).toEqual('...geophysical inversions ');
    expect(tokens[1].children?.[1].content).toEqual('[');
    expect(tokens[1].children?.[2].content).toEqual('@simpeg2015');
    expect(tokens[1].children?.[3].content).toEqual('@heagy2017');
    expect(tokens[1].children?.[4].content).toEqual(']');
    expect(tokens[1].children?.[5].content).toEqual('.');
    const citeGroup = tokens[1].children?.[1];
    expect(citeGroup?.meta.kind).toEqual('parenthetical');
    const citation1 = tokens[1].children?.[2];
    expect(citation1?.meta.label).toEqual('simpeg2015');
    expect(citation1?.meta.kind).toEqual('parenthetical');
    expect(citation1?.meta.prefix).toEqual(undefined);
    expect(citation1?.meta.suffix).toEqual(undefined);
    expect((citation1 as any)?.col).toEqual([27, 38]);
    const citation2 = tokens[1].children?.[3];
    expect(citation2?.meta.label).toEqual('heagy2017');
    expect(citation2?.meta.kind).toEqual('parenthetical');
    expect(citation2?.meta.prefix).toEqual(undefined);
    expect(citation2?.meta.suffix).toEqual(undefined);
    expect((citation2 as any)?.col).toEqual([39, 50]);
  });
  it('complex cite-group', () => {
    const mdit = MarkdownIt().use(citationsPlugin);
    const tokens = mdit.parse(
      '...geophysical inversions [@simpeg2015, pg 23; see -@heagy2017].',
      {},
    );
    expect(tokens.map((t) => t.type)).toEqual(['paragraph_open', 'inline', 'paragraph_close']);
    expect(tokens[1].children?.map((t) => t.type)).toEqual([
      'text',
      'cite_group_open',
      'cite',
      'cite',
      'cite_group_close',
      'text',
    ]);
    expect(tokens[1].content).toEqual(
      '...geophysical inversions [@simpeg2015, pg 23; see -@heagy2017].',
    );
    expect(tokens[1].children?.[0].content).toEqual('...geophysical inversions ');
    expect(tokens[1].children?.[1].content).toEqual('[');
    expect(tokens[1].children?.[2].content).toEqual('@simpeg2015, pg 23');
    expect(tokens[1].children?.[3].content).toEqual('see -@heagy2017');
    expect(tokens[1].children?.[4].content).toEqual(']');
    expect(tokens[1].children?.[5].content).toEqual('.');
    const citeGroup = tokens[1].children?.[1];
    expect(citeGroup?.meta.kind).toEqual('parenthetical');
    const citation1 = tokens[1].children?.[2];
    expect(citation1?.meta.label).toEqual('simpeg2015');
    expect(citation1?.meta.kind).toEqual('parenthetical');
    expect(citation1?.meta.prefix).toEqual(undefined);
    expect(citation1?.meta.suffix[0].content).toEqual('pg 23');
    const citation2 = tokens[1].children?.[3];
    expect(citation2?.meta.label).toEqual('heagy2017');
    expect(citation2?.meta.kind).toEqual('parenthetical');
    expect(citation2?.meta.partial).toEqual('year');
    expect(citation2?.meta.prefix[0].content).toEqual('see');
    expect(citation2?.meta.suffix).toEqual(undefined);
  });
});

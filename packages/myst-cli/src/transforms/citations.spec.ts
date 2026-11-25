import { describe, expect, it } from 'vitest';
import { getCitationRenderers, parseBibTeX } from 'citation-js-utils';
import type { References } from 'myst-common';
import { Session } from '../session';
import { transformCitations } from './citations';

const RENDERER = getCitationRenderers(
  parseBibTeX(`
@article{author1, author={Smith, J.}, title={First}, journal={J}, year={2019}, doi={10.1000/abc123}}
@article{author2, author={Jones, K. and Brown, L.}, title={Second}, journal={J}, year={2020}}
`),
);

const NUMERIC = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info><title>Numeric</title><id>numeric</id><updated>2024-01-01T00:00:00+00:00</updated></info>
  <citation>
    <layout prefix="[" suffix="]" delimiter=", "><text variable="citation-number"/></layout>
  </citation>
  <bibliography>
    <layout><text variable="citation-number" prefix="[" suffix="] "/><text variable="title"/></layout>
  </bibliography>
</style>`;

function citeGroup(kind: string, ...labels: string[]) {
  return {
    type: 'citeGroup',
    kind,
    children: labels.map((label) => ({ type: 'cite', kind, label })),
  };
}

describe('transformCitations', () => {
  it('renders a narrative citation with the default style', () => {
    const mdast: any = {
      type: 'root',
      children: [{ type: 'cite', kind: 'narrative', label: 'author1' }],
    };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references);
    expect(mdast.children[0].children).toEqual([{ type: 'text', value: 'Smith (2019)' }]);
    expect(mdast.children[0].enumerator).toEqual('1');
    expect(references.cite?.order).toEqual(['author1']);
    expect(references.cite?.data?.author1).toMatchObject({
      label: 'author1',
      doi: '10.1000/abc123',
      enumerator: '1',
    });
    expect(references.cite?.data?.author1.html).toContain('Smith, J. (2019). First.');
  });
  it('renders parenthetical groups with style delimiters', () => {
    const mdast: any = {
      type: 'root',
      children: [citeGroup('parenthetical', 'author1', 'author2')],
    };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references);
    const group = mdast.children[0];
    expect(group).toMatchObject({ open: '(', close: ')', delimiter: '; ' });
    expect(group.children.map((c: any) => c.label)).toEqual(['author2', 'author1']);
    expect(group.children[0].children).toEqual([{ type: 'text', value: 'Jones & Brown, 2020' }]);
    expect(references.cite?.order).toEqual(['author2', 'author1']);
  });
  it('numbers citations with a numeric style', () => {
    const mdast: any = {
      type: 'root',
      children: [
        citeGroup('parenthetical', 'author2'),
        citeGroup('parenthetical', 'author1', 'author2'),
        { type: 'cite', kind: 'narrative', label: 'author1' },
      ],
    };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references, { style: NUMERIC });
    expect(mdast.children[0]).toMatchObject({ open: '[', close: ']', delimiter: ', ' });
    expect(mdast.children[0].children[0].children).toEqual([{ type: 'text', value: '1' }]);
    expect(mdast.children[2].children).toEqual([{ type: 'text', value: 'Smith [2]' }]);
    expect(references.cite?.order).toEqual(['author2', 'author1']);
    expect(references.cite?.data?.author2.html).toEqual('[1] Second');
  });
  it('marks unknown citations', () => {
    const mdast: any = { type: 'root', children: [citeGroup('parenthetical', 'author1', 'nope')] };
    const references: References = {};
    transformCitations(new Session(), '', mdast, RENDERER, references);
    const [found, missing] = mdast.children[0].children;
    expect(found.error).toBeUndefined();
    expect(missing.error).toEqual('not found');
    expect(references.cite?.order).toEqual(['author1']);
  });
});

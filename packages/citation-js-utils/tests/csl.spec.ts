import { describe, expect, it } from 'vitest';
import type { CSL } from '../src';
import { getBuiltinCitationStyle, getParentStyleUrl, parseBibTeX, renderCitations } from '../src';

const BIB = `
@article{smith2019a, author={Smith, J.}, title={First}, journal={J}, year={2019}}
@article{smith2019b, author={Smith, J.}, title={Second}, journal={J}, year={2019}}
@article{harris2020, author={Harris, C. R. and Millman, K. J. and van der Walt, S. J.},
  title={Array programming with {NumPy}}, journal={Nature}, year={2020}}
`;

const NUMERIC = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0">
  <info><title>Numeric test</title><id>numeric-test</id><updated>2024-01-01T00:00:00+00:00</updated>
    <category citation-format="numeric"/></info>
  <citation>
    <sort><key variable="citation-number"/></sort>
    <layout prefix="[" suffix="]" delimiter=", "><text variable="citation-number"/></layout>
  </citation>
  <bibliography>
    <layout><text variable="citation-number" prefix="[" suffix="] "/><text variable="title"/></layout>
  </bibliography>
</style>`;

const DEPENDENT = `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" version="1.0" default-locale="en-US">
  <info><title>Journal</title><id>http://www.zotero.org/styles/journal</id>
    <link href="http://www.zotero.org/styles/ieee" rel="independent-parent"/></info>
</style>`;

const data: Record<string, CSL> = Object.fromEntries(parseBibTeX(BIB).map((c) => [c.id, c]));

describe('renderCitations', () => {
  it('renders author-date clusters with disambiguation', () => {
    const { clusters, bibliography } = renderCitations(
      data,
      [
        { kind: 'parenthetical', items: [{ id: 'smith2019b' }] },
        { kind: 'narrative', items: [{ id: 'harris2020' }] },
        { kind: 'parenthetical', items: [{ id: 'smith2019a', prefix: 'see', suffix: 'p. 3' }] },
      ],
      getBuiltinCitationStyle('apa') as string,
    );
    expect(clusters.map((c) => c.html)).toEqual([
      '(Smith, 2019b)',
      'Harris et al. (2020)',
      '(see Smith, 2019a, p. 3)',
    ]);
    expect(clusters[0].items).toEqual([{ id: 'smith2019b', html: 'Smith, 2019b' }]);
    expect(clusters[0]).toMatchObject({ open: '(', close: ')', delimiter: '; ' });
    expect(bibliography.map(({ id }) => id)).toEqual(['harris2020', 'smith2019a', 'smith2019b']);
  });
  it('splits multi-item clusters into items in style order', () => {
    const { clusters } = renderCitations(
      data,
      [{ kind: 'parenthetical', items: [{ id: 'smith2019a' }, { id: 'harris2020' }] }],
      getBuiltinCitationStyle('apa') as string,
    );
    expect(clusters[0].items).toEqual([
      { id: 'harris2020', html: 'Harris et al., 2020' },
      { id: 'smith2019a', html: 'Smith, 2019' },
    ]);
  });
  it('numbers numeric styles in order of first citation', () => {
    const { clusters, bibliography } = renderCitations(
      data,
      [
        { kind: 'parenthetical', items: [{ id: 'smith2019b' }] },
        { kind: 'parenthetical', items: [{ id: 'harris2020' }, { id: 'smith2019b' }] },
        { kind: 'narrative', items: [{ id: 'harris2020' }] },
        { kind: 'parenthetical', items: [{ id: 'harris2020', partial: 'author' }] },
      ],
      NUMERIC,
    );
    expect(clusters.map((c) => c.html)).toEqual([
      '[1]',
      '[1, 2]',
      'Harris <i>et al.</i> [2]',
      'Harris <i>et al.</i>',
    ]);
    expect(clusters[1].items).toEqual([
      { id: 'smith2019b', html: '1' },
      { id: 'harris2020', html: '2' },
    ]);
    expect(bibliography).toEqual([
      { id: 'smith2019b', html: '<div class="csl-entry">[1] Second</div>' },
      { id: 'harris2020', html: '<div class="csl-entry">[2] Array programming with NumPy</div>' },
    ]);
  });
});

describe('getParentStyleUrl', () => {
  it('returns the parent of a dependent style', () => {
    expect(getParentStyleUrl(DEPENDENT)).toEqual('http://www.zotero.org/styles/ieee');
  });
  it('returns undefined for an independent style', () => {
    expect(getParentStyleUrl(NUMERIC)).toBeUndefined();
  });
});

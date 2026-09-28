import { describe, expect, test } from 'vitest';
import {
  MultiPageReferenceResolver,
  ReferenceState,
  enumerateTargetsTransform,
  formatHeadingEnumerator,
  incrementHeadingCounts,
  initializeTargetCounts,
  resolveReferenceLinksTransform,
} from './enumerate';
import { u } from 'unist-builder';
import { VFile } from 'vfile';

describe('Heading counts and formatting', () => {
  test.each([
    [2, [0, 0, 0, null, 0, 0], [0, 1, 0, null, 0, 0]],
    [1, [0, 1, 0, null, 0, 0], [1, 0, 0, null, 0, 0]],
    [2, [1, 0, 0, null, 0, 0], [1, 1, 0, null, 0, 0]],
    [5, [1, 1, 0, null, 0, 0], [1, 1, 0, null, 1, 0]],
    [5, [1, 1, 0, null, 1, 0], [1, 1, 0, null, 2, 0]],
    [2, [1, 1, 0, null, 2, 0], [1, 2, 0, null, 0, 0]],
    [1, [1, 2, 0, null, 0, 0], [2, 0, 0, null, 0, 0]],
  ])('incrementHeadingCounts(%s, %s)}', (depth, counts, out) => {
    expect(incrementHeadingCounts(depth, counts)).toEqual(out);
  });
  test.each([
    [[0, 0, 0, null, 0, 0], ''],
    [[0, 1, 0, null, 0, 0], '0.1'],
    [[1, 0, 0, null, 0, 0], '1'],
    [[1, 1, 0, null, 0, 0], '1.1'],
    [[1, 1, 0, null, 1, 0], '1.1.0.1'],
    [[1, 1, 0, null, 2, 0], '1.1.0.2'],
    [[1, 2, 0, null, 0, 0], '1.2'],
  ])('formatHeadingEnumerator(%s)}', (counts, out) => {
    expect(formatHeadingEnumerator(counts)).toEqual(out);
  });
});

describe('reference resolution', () => {
  test('links to case-sensitive targets keep the matched identifier', () => {
    // Targets with exact-case identifiers (e.g. Python API objects registered
    // by a plugin): re.Match (class) and re.match (function) are distinct.
    const tree = u('root', [
      u('div', { identifier: 'sample.Match', html_id: 'sample.Match', children: [] }),
      u('div', { identifier: 'sample.match', html_id: 'sample.match', children: [] }),
      u('link', { url: '#sample.Match' }, [u('text', 'class ref')]),
      u('link', { url: '#sample.match' }, [u('text', 'function ref')]),
    ]);
    const state = new ReferenceState('my-file.md', { vfile: new VFile() });
    enumerateTargetsTransform(tree, { state });
    resolveReferenceLinksTransform(tree, { state });
    const [classRef, functionRef] = (tree.children as any[]).filter(
      (node) => node.type === 'crossReference',
    );
    expect(classRef.identifier).toBe('sample.Match');
    expect(functionRef.identifier).toBe('sample.match');
  });

  describe('ReferenceState.getTarget', () => {
    test('matches an exact-case identifier verbatim', () => {
      const tree = u('root', [
        u('div', { identifier: 'sample.Match', html_id: 'sample.Match', children: [] }),
      ]);
      const state = new ReferenceState('my-file.md', { vfile: new VFile() });
      enumerateTargetsTransform(tree, { state });
      expect(state.getTarget('sample.Match')?.node.identifier).toBe('sample.Match');
    });

    test('falls back to the normalized form for prose labels', () => {
      // Prose labels are stored normalized (lowercased) by normalizeLabel at
      // creation time, so a differently-cased lookup must still find them.
      const tree = u('root', [u('heading', { identifier: 'my-section', children: [] })]);
      const state = new ReferenceState('my-file.md', { vfile: new VFile() });
      enumerateTargetsTransform(tree, { state });
      expect(state.getTarget('My-Section')?.node.identifier).toBe('my-section');
    });

    test('does not let a normalized fallback shadow a case-distinct sibling', () => {
      const tree = u('root', [
        u('div', { identifier: 'sample.Match', html_id: 'sample.Match', children: [] }),
        u('div', { identifier: 'sample.match', html_id: 'sample.match', children: [] }),
      ]);
      const state = new ReferenceState('my-file.md', { vfile: new VFile() });
      enumerateTargetsTransform(tree, { state });
      expect(state.getTarget('sample.Match')?.node.identifier).toBe('sample.Match');
      expect(state.getTarget('sample.match')?.node.identifier).toBe('sample.match');
    });
  });

  test('cross-page: an exact-case target is preferred over an earlier normalized match', () => {
    // sample.match lives on page one, sample.Match on page two; a reference to
    // sample.Match must resolve to page two, not page one's normalized fallback.
    const pageOne = u('root', [
      u('div', { identifier: 'sample.match', html_id: 'sample.match', children: [] }),
    ]);
    const pageTwo = u('root', [
      u('div', { identifier: 'sample.Match', html_id: 'sample.Match', children: [] }),
    ]);
    const stateOne = new ReferenceState('page-one.md', { vfile: new VFile() });
    const stateTwo = new ReferenceState('page-two.md', { vfile: new VFile() });
    enumerateTargetsTransform(pageOne, { state: stateOne });
    enumerateTargetsTransform(pageTwo, { state: stateTwo });
    const resolver = new MultiPageReferenceResolver([stateOne, stateTwo], 'page-one.md');
    expect(resolver.getTarget('sample.Match')?.node.identifier).toBe('sample.Match');
    expect(resolver.getTarget('sample.match')?.node.identifier).toBe('sample.match');
  });
});

describe('enumeration', () => {
  test('figure enumerators', () => {
    const tree = u('root', [
      u('heading', { identifier: 'ha', depth: 2 }),
      u('heading', { identifier: 'hb', depth: 3 }),
      u('heading', { identifier: 'hc', depth: 3 }),
      u('container', { kind: 'figure', identifier: 'fig1' }),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: {
        numbering: {
          heading_1: { enabled: true },
          heading_2: { enabled: true },
          figure: { enumerator: 'FancyTemplateSoon.%s' },
        },
      },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('fig1')?.node.enumerator).toBe('FancyTemplateSoon.1');
  });
  test('sub-equations', () => {
    const tree = u('root', [
      u('mathGroup', { identifier: 'eq:1' }, [
        u('math', { identifier: 'eq:1a', kind: 'subequation' }),
        u('math', { identifier: 'eq:1b', kind: 'subequation' }),
      ]),
      u('math', { identifier: 'eq:x', enumerated: false }),
      u('math', { identifier: 'eq:2' }),
      u('mathGroup', { identifier: 'eq:3' }, [
        u('math', { identifier: 'eq:3-1', kind: 'subequation', enumerated: false }),
        u('math', { identifier: 'eq:3-2', kind: 'subequation' }),
        u('math', { identifier: 'eq:3-3', kind: 'subequation', enumerated: false }),
        u('math', { identifier: 'eq:3-4', kind: 'subequation' }),
      ]),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { enumerator: { enumerator: 'A.%s' } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('eq:1')?.node.enumerator).toBe('A.1');
    expect(state.getTarget('eq:1a')?.node.enumerator).toBe('A.1a');
    expect(state.getTarget('eq:1b')?.node.enumerator).toBe('A.1b');
    expect(state.getTarget('eq:x')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:2')?.node.enumerator).toBe('A.2');
    expect(state.getTarget('eq:3')?.node.enumerator).toBe('A.3');
    expect(state.getTarget('eq:3-1')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:3-2')?.node.enumerator).toBe('A.3a');
    expect(state.getTarget('eq:3-3')?.node.enumerator).toBeUndefined();
    expect(state.getTarget('eq:3-4')?.node.enumerator).toBe('A.3b');
  });
  test('headers', () => {
    const tree = u('root', [
      u('heading', { identifier: 'h1', depth: 2 }),
      u('heading', { identifier: 'h2', depth: 3 }),
      u('heading', { identifier: 'h3', depth: 2 }),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { heading_1: { enabled: true }, heading_2: { enabled: true } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('h1')?.node.enumerator).toBe('1');
    expect(state.getTarget('h2')?.node.enumerator).toBe('1.1');
    expect(state.getTarget('h3')?.node.enumerator).toBe('2');
  });
  test('sub-figures', () => {
    const tree = u('root', [
      u('container', { identifier: 'fig:1', kind: 'figure' }, [
        u('container', { identifier: 'fig:1a', kind: 'figure', subcontainer: true }),
        u('container', { identifier: 'fig:1b', kind: 'figure', subcontainer: true }),
        u('container', { kind: 'figure', subcontainer: true }),
      ]),
      u('container', { identifier: 'fig:2', kind: 'figure' }, []),
    ]);
    const state = new ReferenceState('my-file.md', {
      frontmatter: { numbering: { enumerator: { enumerator: 'A.%s' } } },
      vfile: new VFile(),
    });
    enumerateTargetsTransform(tree, { state });
    expect(state.getTarget('fig:1')?.node.enumerator).toBe('A.1');
    expect(state.getTarget('fig:1a')?.node.enumerator).toBe('a');
    expect(state.getTarget('fig:1a')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:1b')?.node.enumerator).toBe('b');
    expect(state.getTarget('fig:1b')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:1-c')?.node.enumerator).toBe('c');
    expect(state.getTarget('fig:1-c')?.node.parentEnumerator).toBe('A.1');
    expect(state.getTarget('fig:2')?.node.enumerator).toBe('A.2');
  });
});
describe('initializeTargetCounts', () => {
  test('no inputs initializes heading', () => {
    expect(initializeTargetCounts({})).toEqual({ heading: [0, 0, 0, 0, 0, 0] });
  });
  test('previousCounts unchanged if continue is true', () => {
    const initialCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      other: { main: 0, sub: 0 },
    };
    expect(
      initializeTargetCounts({ all: { continue: true, enabled: true } }, initialCounts as any),
    ).toEqual(initialCounts);
  });
  test('numbering starts are respected', () => {
    const numbering = {
      heading_1: { enabled: true, start: 5 },
      heading_2: { enabled: false, start: 2 },
      heading_5: { enabled: true, start: 2 },
      figure: { enabled: true, start: 5 },
      other: { enabled: true, start: 8 },
    };
    expect(initializeTargetCounts(numbering)).toEqual({
      heading: [4, null, 0, 0, 1, 0],
      figure: { main: 4, sub: 0 },
      other: { main: 7, sub: 0 },
    });
  });
  test('previousCounts override are prioritized', () => {
    const previousCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      other: { main: 3, sub: 0 },
    };
    expect(
      initializeTargetCounts(
        {
          heading_1: { continue: true, enabled: true },
          heading_2: { continue: true, enabled: true },
          heading_3: { continue: true, enabled: true },
          heading_4: { continue: true, enabled: true },
          heading_5: { continue: true, enabled: true },
          heading_6: { continue: true, enabled: true },
          figure: { continue: true, enabled: true },
          other: { continue: true, enabled: true },
        },
        previousCounts as any,
      ),
    ).toEqual(previousCounts);
  });
  test('explicit numberings override previous', () => {
    const previousCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
    };
    const numbering = {
      heading_1: { enabled: true, start: 5, continue: true },
      heading_2: { enabled: false, start: 2, continue: true },
      heading_5: { enabled: true, start: 2, continue: true },
      figure: { enabled: true, start: 5, continue: true },
      code: { enabled: true, start: 8, continue: true },
    };
    expect(initializeTargetCounts(numbering, previousCounts as any)).toEqual({
      heading: [4, null, 0, 0, 1, 0],
      figure: { main: 4, sub: 0 },
      code: { main: 7, sub: 0 },
    });
  });
  test('unknown numberings reset from previousCounts', () => {
    const previousCounts = {
      heading: [5, 3, 1, 0, null, null],
      figure: { main: 7, sub: 2 },
      exercise: { main: 5, sub: 0 },
    };
    const numbering = {
      heading_1: { enabled: true, start: 5, continue: true },
      heading_2: { enabled: false, start: 2, continue: true },
      heading_5: { enabled: true, start: 2, continue: true },
      figure: { enabled: true, start: 5, continue: true },
    };
    expect(initializeTargetCounts(numbering, previousCounts as any)).toEqual({
      heading: [4, null, 0, 0, 1, 0],
      figure: { main: 4, sub: 0 },
    });
  });
});

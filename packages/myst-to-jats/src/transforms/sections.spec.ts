import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { sectionTransform } from './sections';

describe('Section nesting', () => {
  test('basic sections', () => {
    const tree = u('root', [u('text', 'child'), u('heading', { depth: 1 }), u('text', 'hello!')]);
    sectionTransform(tree, {});
    const sections = u('root', [
      u('text', 'child'),
      u('section', { depth: 1 }, [u('heading'), u('text', 'hello!')]),
    ]);
    expect(tree).toEqual(sections);
  });
  test('two sections', () => {
    const tree = u('root', [
      u('heading', { depth: 1 }, [u('text', 'h1')]),
      u('text', 'hello!'),
      u('heading', { depth: 1 }, [u('text', 'h2')]),
      u('text', 'second'),
    ]);
    sectionTransform(tree, {});
    const sections = u('root', [
      u('section', { depth: 1 }, [u('heading', [u('text', 'h1')]), u('text', 'hello!')]),
      u('section', { depth: 1 }, [u('heading', [u('text', 'h2')]), u('text', 'second')]),
    ]);
    expect(tree).toEqual(sections);
  });
  test('nested sections', () => {
    const tree = u('root', [
      u('heading', { depth: 1 }, [u('text', 'h1')]),
      u('text', 'hello!'),
      u('heading', { depth: 2 }, [u('text', 'h2')]),
      u('text', 'second'),
    ]);
    sectionTransform(tree, {});
    const sections = u('root', [
      u('section', { depth: 1 }, [
        u('heading', [u('text', 'h1')]),
        u('text', 'hello!'),
        u('section', { depth: 2 }, [u('heading', [u('text', 'h2')]), u('text', 'second')]),
      ]),
    ]);
    expect(tree).toEqual(sections);
  });

  test('nested sections - reversed', () => {
    const tree = u('root', [
      u('heading', { depth: 2 }, [u('text', 'h2')]),
      u('text', 'hello!'),
      u('heading', { depth: 1 }, [u('text', 'h1')]),
      u('text', 'second'),
    ]);
    sectionTransform(tree, {});
    const sections = u('root', [
      u('section', { depth: 2 }, [u('heading', [u('text', 'h2')]), u('text', 'hello!')]),
      u('section', { depth: 1 }, [u('heading', [u('text', 'h1')]), u('text', 'second')]),
    ]);
    expect(tree).toEqual(sections);
  });
  test('three sections', () => {
    const tree = u('root', [
      u('heading', { depth: 1 }, [u('text', 'h1')]),
      u('text', 'hello!'),
      u('heading', { depth: 2 }, [u('text', 'h2-1')]),
      u('text', 'second'),
      u('heading', { depth: 2 }, [u('text', 'h2-2')]),
      u('text', 'third'),
    ]);
    sectionTransform(tree, {});
    const sections = u('root', [
      u('section', { depth: 1 }, [
        u('heading', [u('text', 'h1')]),
        u('text', 'hello!'),
        u('section', { depth: 2 }, [u('heading', [u('text', 'h2-1')]), u('text', 'second')]),
        u('section', { depth: 2 }, [u('heading', [u('text', 'h2-2')]), u('text', 'third')]),
      ]),
    ]);
    expect(tree).toEqual(sections);
  });
});

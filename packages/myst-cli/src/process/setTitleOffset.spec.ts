import { describe, expect, it } from 'vitest';
import { fillPageFrontmatter } from 'myst-frontmatter';
import type { ProjectFrontmatter } from 'myst-frontmatter';
import { setTitleOffset } from './mdast';

function deepFreeze<T>(obj: T): T {
  Object.values(obj as object).forEach((value) => {
    if (value && typeof value === 'object') deepFreeze(value);
  });
  return Object.freeze(obj);
}

describe('setTitleOffset', () => {
  it('does not modify project numbering shared with the page', () => {
    const project: ProjectFrontmatter = deepFreeze({ numbering: { title: { enabled: true } } });
    const page = fillPageFrontmatter({}, project, { property: 'frontmatter', messages: {} });
    setTitleOffset(page, 1);
    expect(page.numbering?.title).toEqual({ enabled: true, offset: 1 });
    expect(project.numbering?.title).toEqual({ enabled: true });
  });
  it('creates numbering if it is missing', () => {
    const page = {};
    setTitleOffset(page, 2);
    expect(page).toEqual({ numbering: { title: { offset: 2 } } });
  });
  it('keeps an existing offset', () => {
    const page = { numbering: { title: { offset: 3 } } };
    setTitleOffset(page, 1);
    expect(page.numbering.title.offset).toBe(3);
  });
});

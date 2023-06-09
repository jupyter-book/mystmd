import { describe, expect, it } from 'vitest';
import type { Root } from 'mdast';
import { getFrontmatter } from './frontmatter';

describe('getFrontmatter', () => {
  it('empty tree passes', () => {
    const input = {
      type: 'root',
      children: [],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('tree without block and no frontmatter passes', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('tree with block and no frontmatter passes', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'text',
              value: 'hello',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('non-yaml code block passes', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'python',
          value: 'title: My Title',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('yaml code block creates frontmatter, do not remove yaml', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('empty yaml code block does not crash', () => {
    // This is a block of `---\n---` at the start of a document
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: '',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root);
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('yaml code block creates frontmatter, remove yaml', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeYaml: true });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('yaml code block creates frontmatter, remove yaml does not remove only child', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeYaml: true });
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('title extracted from heading node, do not remove heading', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Heading Title',
            },
          ],
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'Heading Title' });
  });
  it('title extracted from heading node, remove heading', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Heading Title',
            },
          ],
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeHeading: true });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title' });
  });
  it('title extracted from heading node, remove heading does not remove only child', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Heading Title',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeHeading: true });
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'Heading Title' });
  });
  it('heading title ignored if present in frontmatter', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
        {
          type: 'heading',
          depth: 2,
          children: [
            {
              type: 'text',
              value: 'Heading Title',
            },
          ],
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeHeading: true });
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('heading removed if duplicates frontmatter title', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'My Title',
            },
          ],
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, { removeHeading: true });
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: My Title',
        },
        {
          type: 'text',
          value: 'hello',
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('yaml code block creates frontmatter, nested in block', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'code',
              lang: 'yaml',
              value: 'title: My Title',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('yaml code block creates frontmatter, nested in block', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'code',
              lang: 'yaml',
              value: 'title: My Title',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(input as Root, {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
});

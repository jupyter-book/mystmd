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
  it('title is extracted from any heading if not in frontmatter', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'subtitle: My Subtitle',
        },
        {
          type: 'text',
          value: 'hello',
        },
        {
          type: 'text',
          value: 'hello',
        },
        {
          type: 'heading',
          depth: 5,
          children: [
            {
              type: 'text',
              value: 'Small Title',
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
    expect(frontmatter).toEqual({ title: 'Small Title', subtitle: 'My Subtitle' });
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

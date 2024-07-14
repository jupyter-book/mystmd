import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { getFrontmatter } from './frontmatter';

function copy(input: Record<string, any>) {
  return JSON.parse(JSON.stringify(input));
}

describe('getFrontmatter', () => {
  it('empty tree passes', () => {
    const input = {
      type: 'root',
      children: [],
    };
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
  });
  it('invalid yaml code block passes', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: Title: My Title',
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({});
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input));
    expect(tree).toEqual({
      type: 'root',
      children: [],
    });
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input));
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
  it('yaml code block only creates frontmatter, is removed', () => {
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input));
    expect(tree).toEqual({
      type: 'root',
      children: [],
    });
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('title extracted from h1 heading node, remove heading', () => {
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
  });
  it('title extracted from h2 heading node, do not remove heading', () => {
    const input = {
      type: 'root',
      children: [
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: true });
  });
  it('title extracted from non-first h1 heading node, do not remove heading', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual(input);
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: true });
  });
  it('title extracted from first h1 heading node, only first heading removed', () => {
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
  });
  it('title extracted from single heading node, is removed', () => {
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({ type: 'root', children: [] });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({
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
    });
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'My Title', content_includes_title: false });
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
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'My Title' });
  });
  it('title extracted from first h1 heading node, not removed if title is null', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: null',
        },
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: true });
    expect(file.messages.length).toBe(0);
  });
  it('title extracted from first h1 heading node, removed if nested in block', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: '',
        },
        {
          type: 'block',
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
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'block',
          children: [
            {
              type: 'text',
              value: 'hello',
            },
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
    expect(file.messages.length).toBe(0);
  });
  it('title extracted from first h1 heading node, removed if only comments before', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'block',
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
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'block',
          children: [
            {
              type: 'text',
              value: 'hello',
            },
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
    expect(file.messages.length).toBe(0);
  });
  it('title extracted from first h1 heading node, removed if only yaml and comments before', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: '',
        },
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'block',
          children: [
            {
              type: 'comment',
              value: '',
            },
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
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'comment',
          value: '',
        },
        {
          type: 'block',
          children: [
            {
              type: 'comment',
              value: '',
            },
            {
              type: 'text',
              value: 'hello',
            },
            {
              type: 'heading',
              depth: 1,
              children: [
                {
                  type: 'text',
                  value: 'Another Heading',
                },
              ],
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
    expect(file.messages.length).toBe(0);
  });
  it('title extracted from first h1 heading node, content_includes_title false ignored', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'title: null\ncontent_includes_title: false',
        },
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: true });
    expect(file.messages.length).toBe(1);
  });
  it('title extracted from first h1 heading node, content_includes_title true ignored', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'content_includes_title: true',
        },
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    };
    const file = new VFile();
    const { tree, frontmatter } = getFrontmatter(file, copy(input), {});
    expect(tree).toEqual({
      type: 'root',
      children: [
        {
          type: 'text',
          value: 'hello',
        },
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({ title: 'Heading Title', content_includes_title: false });
    expect(file.messages.length).toBe(1);
  });
  it('first h1 label carries to page', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'heading',
          depth: 1,
          label: 'h1',
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
    const { identifiers } = getFrontmatter(new VFile(), copy(input), {});
    expect(identifiers).toEqual(['h1']);
  });
  it('preFrontmatter fills and replaces file frontmatter', () => {
    const input = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'yaml',
          value: 'doi: 10.1000/abcd/efg012\ndate: 14 Dec 2021',
        },
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    };
    const { tree, frontmatter } = getFrontmatter(new VFile(), copy(input), {
      preFrontmatter: { title: 'Pre Frontmatter Title', date: '4 May 2022' },
    });
    expect(tree).toEqual({
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
        {
          type: 'heading',
          depth: 1,
          children: [
            {
              type: 'text',
              value: 'Another Heading',
            },
          ],
        },
      ],
    });
    expect(frontmatter).toEqual({
      title: 'Pre Frontmatter Title',
      date: '4 May 2022',
      doi: '10.1000/abcd/efg012',
    });
  });
});

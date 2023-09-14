import type { Heading } from 'myst-spec';
import type { Contributor } from 'myst-frontmatter';

export function createArticleTitle(blockTitle?: string, authors?: Contributor[]) {
  const headings: Heading[] = [];
  if (blockTitle) {
    headings.push({
      type: 'heading',
      depth: 1,
      children: [{ type: 'text', value: blockTitle }],
    });
  }
  // TODO: actually do a subtitle
  const authorNames = !authors ? undefined : authors.map((v) => v.name || 'Unknown Author');
  if (authorNames && authorNames.length) {
    headings.push({
      type: 'heading',
      depth: 4,
      children: [{ type: 'text', value: authorNames.join(', ') }],
    });
  }
  return headings;
}

export function createReferenceTitle(): Heading {
  return {
    type: 'heading',
    depth: 2,
    children: [{ type: 'text', value: 'References' }],
  };
}

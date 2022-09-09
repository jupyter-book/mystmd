import type { Node } from 'prosemirror-model';
import { schemas } from '@curvenote/schema';
import type { Author } from '@curvenote/blocks';

export async function createArticleTitle(blockTitle: string, authors: Partial<Author>[]) {
  const schema = schemas.getSchema('full');
  const header = schema.nodes.heading.createAndFill({ level: 1 }, schema.text(blockTitle)) as Node;
  // TODO: actually do a subtitle
  const authorNames = !authors ? undefined : authors.map((v) => v.name || 'Unknown Author');
  if (authorNames && authorNames.length) {
    const subtitle = schema.nodes.heading.createAndFill(
      { level: 4 },
      schema.text(authorNames.join(', ')),
    ) as Node;
    return schema.nodes.doc.createAndFill({}, [header, subtitle]) as Node;
  }

  return schema.nodes.doc.createAndFill({}, [header]) as Node;
}

export function createReferenceTitle() {
  const schema = schemas.getSchema('full');
  const header = schema.nodes.heading.createAndFill(
    { level: 2 },
    schema.text('References'),
  ) as Node;
  const doc = schema.nodes.doc.createAndFill({}, [header]) as Node;
  return doc;
}

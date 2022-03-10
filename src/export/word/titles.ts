import { schemas } from '@curvenote/schema';
import { Node } from 'prosemirror-model';
import { Block as BlockDTO } from '@curvenote/blocks';
import { ISession } from '../../session/types';

export async function createArticleTitle(session: ISession, data: BlockDTO) {
  const schema = schemas.getSchema('full');
  const header = schema.nodes.heading.createAndFill({ level: 1 }, schema.text(data.title)) as Node;
  // TODO: actually do a subtitle
  const authors = data.authors.map((v) => v.name || 'Unknown Author');
  const subtitle = schema.nodes.heading.createAndFill(
    { level: 4 },
    schema.text(authors.join(', ')),
  ) as Node;
  const doc = schema.nodes.doc.createAndFill({}, [header, subtitle]) as Node;
  return doc;
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

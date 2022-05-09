import { schemas } from '@curvenote/schema';
import { Node } from 'prosemirror-model';
import { Project as ProjectDTO, Block as BlockDTO } from '@curvenote/blocks';
import { ISession } from '../../session/types';

export async function createArticleTitle(
  session: ISession,
  projectData: ProjectDTO,
  blockData: BlockDTO,
) {
  const schema = schemas.getSchema('full');
  const header = schema.nodes.heading.createAndFill(
    { level: 1 },
    schema.text(blockData.title),
  ) as Node;
  // TODO: actually do a subtitle
  const authorsData = blockData.authors ?? projectData.authors;
  const authors = !authorsData ? undefined : authorsData.map((v) => v.name || 'Unknown Author');
  if (authors) {
    const subtitle = schema.nodes.heading.createAndFill(
      { level: 4 },
      schema.text(authors.join(', ')),
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

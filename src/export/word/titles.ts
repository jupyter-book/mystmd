import { getSchema } from '@curvenote/schema/dist/schemas';
import { Node } from 'prosemirror-model';
import { Block as BlockDTO } from '@curvenote/blocks';
import { User } from '../../models';
import { ISession } from '../../session/types';

export async function createArticleTitle(session: ISession, data: BlockDTO) {
  const schema = getSchema('full');
  const header = schema.nodes.heading.createAndFill({ level: 1 }, schema.text(data.title)) as Node;
  // TODO: actually do a subtitle
  const authors = await Promise.all(
    data.authors.map(async (v) => {
      if (v.plain) return v.plain;
      const user = await new User(session, v.user as string).get();
      return user.data.display_name;
    }),
  );
  const subtitle = schema.nodes.heading.createAndFill(
    { level: 4 },
    schema.text(authors.join(', ')),
  ) as Node;
  const doc = schema.nodes.doc.createAndFill({}, [header, subtitle]) as Node;
  return doc;
}

export function createReferenceTitle() {
  const schema = getSchema('full');
  const header = schema.nodes.heading.createAndFill(
    { level: 2 },
    schema.text('References'),
  ) as Node;
  const doc = schema.nodes.doc.createAndFill({}, [header]) as Node;
  return doc;
}

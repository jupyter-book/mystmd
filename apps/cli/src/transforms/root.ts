import { State, transform, unified } from 'mystjs';
import { Root } from '../myst';

export async function transformRoot(mdast: Root): Promise<Root> {
  const state = new State();
  mdast = await unified()
    .use(transform, state, { addContainerCaptionNumbers: true })
    .run(mdast as any);
  return mdast;
}

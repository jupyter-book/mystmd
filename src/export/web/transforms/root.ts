import { State, transform, unified } from 'mystjs';
import { Root } from './types';

export async function transformRoot(mdast: Root) {
  const state = new State();
  mdast = await unified()
    .use(transform, state, { addContainerCaptionNumbers: true })
    .run(mdast as any);
  return mdast;
}

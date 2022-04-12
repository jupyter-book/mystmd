import { NodeRenderer, useParse, DEFAULT_RENDERERS } from '~/myst-to-react';
import type { GenericParent } from 'mystjs';

export function ContentBlock({
  id,
  node,
  renderers = DEFAULT_RENDERERS,
}: {
  id: string;
  node: GenericParent;
  renderers?: Record<string, NodeRenderer>;
}) {
  const children = useParse(node, renderers);
  return <div id={id}>{children}</div>;
}

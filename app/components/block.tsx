import { NodeRenderer, useParse } from 'myst-util-to-react';
import type { GenericParent } from 'mystjs';
import { defaultRenderers } from './renderers';

export function ContentBlock({
  id,
  node,
  renderers = defaultRenderers,
}: {
  id: string;
  node: GenericParent;
  renderers?: Record<string, NodeRenderer>;
}) {
  const children = useParse(node, renderers);
  return <div id={id}>{children}</div>;
}

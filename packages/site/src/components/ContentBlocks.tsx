import type { NodeRenderer } from 'myst-util-to-react';
import { useParse, DEFAULT_RENDERERS } from 'myst-util-to-react';
import type { GenericParent } from 'mystjs';

function Block({
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

export function ContentBlocks({
  mdast,
}: {
  mdast: GenericParent<Record<string, any>>;
}) {
  const blocks = mdast.children as GenericParent[];
  return (
    <>
      {blocks.map((node, index) => {
        return <Block key={node.key} id={`${index}`} node={node} />;
      })}
    </>
  );
}

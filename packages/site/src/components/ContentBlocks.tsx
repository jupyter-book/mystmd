import type { NodeRenderer } from 'myst-to-react';
import { useParse, DEFAULT_RENDERERS } from 'myst-to-react';
import type { Parent } from 'myst-spec';

function Block({
  id,
  node,
  renderers = DEFAULT_RENDERERS,
}: {
  id: string;
  node: Parent;
  renderers?: Record<string, NodeRenderer>;
}) {
  const children = useParse(node, renderers);
  return <div id={id}>{children}</div>;
}

export function ContentBlocks({
  mdast,
  renderers,
}: {
  mdast: Parent;
  renderers?: Record<string, NodeRenderer>;
}) {
  const blocks = mdast.children as Parent[];
  return (
    <>
      {blocks.map((node, index) => {
        return <Block key={(node as any).key} id={`${index}`} node={node} renderers={renderers} />;
      })}
    </>
  );
}

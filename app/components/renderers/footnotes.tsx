import { useParse, Component, NodeTypes } from 'myst-util-to-react';
import { useReferences } from '../ReferencesProvider';
import type { GenericParent } from 'mystjs';
import { ClickPopover } from './ClickPopover';

export function FootnoteDefinition({ identifier }: { identifier: string }) {
  const references = useReferences();
  const node = references?.footnotes[identifier];
  if (!node) return null;
  const children = useParse(node as GenericParent);
  return <div>{children}</div>;
}

export const FootnoteReference: Component = (node) => {
  return (
    <ClickPopover
      key={node.key}
      card={<FootnoteDefinition identifier={node.identifier as string} />}
    >
      [{node.identifier}]
    </ClickPopover>
  );
};

export const footnoteRenderers: NodeTypes = {
  footnoteReference: FootnoteReference,
};

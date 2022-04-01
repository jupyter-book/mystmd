import type { GenericParent } from 'mystjs';
import { useParse, NodeRenderer } from 'myst-util-to-react';
import { useReferences } from '../ReferencesProvider';
import { ClickPopover } from './ClickPopover';

export function FootnoteDefinition({ identifier }: { identifier: string }) {
  const references = useReferences();
  const node = references?.footnotes[identifier];
  if (!node) return null;
  const children = useParse(node as GenericParent);
  return <>{children}</>;
}

export const FootnoteReference: NodeRenderer = (node) => {
  return (
    <ClickPopover
      key={node.key}
      card={<FootnoteDefinition identifier={node.identifier as string} />}
      as="span"
    >
      <sup>[{node.identifier}]</sup>
    </ClickPopover>
  );
};

export const footnoteRenderers = {
  footnoteReference: FootnoteReference,
};

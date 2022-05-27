import { selectAll } from 'unist-util-select';
import { CrossReference } from 'myst-spec';
import LinkIcon from '@heroicons/react/outline/LinkIcon';
import { useReferences } from '~/components/ReferencesProvider';
import { useParse } from '~/myst-to-react';
import { InlineError } from './inlineError';
import { NodeRenderer } from './types';
import { ClickPopover } from './ClickPopover';

export function ReferencedContent({
  identifier,
  close,
}: {
  identifier: string;
  close: () => void;
}) {
  const references = useReferences();
  const node = selectAll(`[identifier=${identifier}]`, references?.article).filter(
    ({ type }) => type === 'container' || type === 'math',
  )[0];
  const onClose = () => {
    // Need to close it first because the ID is on the page twice ...
    close();
    setTimeout(() => {
      const el = document.getElementById(identifier);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 10);
  };
  if (!node) {
    return (
      <>
        <button onClick={onClose} className="absolute top-4 right-1">
          <LinkIcon className="w-6 h-6" />
        </button>
        <InlineError
          value={identifier || 'No Label'}
          message="Cross Reference Not Found"
        />
      </>
    );
  }
  const children = useParse({ type: 'block', children: [node] });
  return (
    <>
      <button onClick={onClose} className="absolute top-4 right-1">
        <LinkIcon className="w-6 h-6" />
      </button>
      {children}
    </>
  );
}

export const CrossReferenceNode: NodeRenderer<CrossReference> = (node, children) => {
  if (!children) {
    return (
      <InlineError
        key={node.key}
        value={node.label || node.identifier || 'No Label'}
        message="Cross Reference Not Found"
      />
    );
  }
  return (
    <ClickPopover
      key={node.key}
      card={({ close }) => (
        <ReferencedContent identifier={node.identifier as string} close={close} />
      )}
      as="span"
    >
      {children}
    </ClickPopover>
  );
};

const CROSS_REFERENCE_RENDERERS = {
  crossReference: CrossReferenceNode,
};

export default CROSS_REFERENCE_RENDERERS;

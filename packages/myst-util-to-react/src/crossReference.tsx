import { selectAll } from 'unist-util-select';
import { EXIT, SKIP, visit } from 'unist-util-visit';
import type { CrossReference } from 'myst-spec';
import LinkIcon from '@heroicons/react/outline/LinkIcon';
import { useReferences } from '@curvenote/ui-providers';
import { useParse } from '.';
import { InlineError } from './inlineError';
import type { NodeRenderer } from './types';
import { ClickPopover } from './ClickPopover';

const MAX_NODES = 3; // Max nodes to show after a header

export function ReferencedContent({
  identifier,
  close,
}: {
  identifier: string;
  close: () => void;
}) {
  const references = useReferences();
  const identifiers = selectAll(`[identifier=${identifier}]`, references?.article);
  const container = identifiers.filter(({ type }) => type === 'container' || type === 'math')[0];
  const nodes = container ? [container] : [];
  if (nodes.length === 0 && identifiers.length > 0 && references?.article) {
    let begin = false;
    visit(references.article, (node) => {
      if ((begin && node.type === 'heading') || nodes.length >= MAX_NODES) return EXIT;
      if (node.identifier === identifier && node.type === 'heading') begin = true;
      if (begin) {
        nodes.push(node);
        return SKIP; // Don't traverse the children
      }
    });
  }
  const htmlId = (nodes[0] as any)?.html_id;
  const onClose = () => {
    // Need to close it first because the ID is on the page twice ...
    close();
    setTimeout(() => {
      const el = document.getElementById(htmlId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 10);
  };
  const children = useParse({ type: 'block', children: nodes });
  if (!nodes || nodes.length === 0) {
    return (
      <>
        <button onClick={onClose} className="absolute top-4 right-1">
          <LinkIcon className="w-6 h-6" />
        </button>
        <InlineError value={identifier || 'No Label'} message="Cross Reference Not Found" />
      </>
    );
  }
  return (
    <div className="exclude-from-outline">
      <button onClick={onClose} className="absolute top-4 right-1">
        <LinkIcon className="w-6 h-6" />
      </button>
      {children}
    </div>
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

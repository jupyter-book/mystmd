import { selectAll } from 'unist-util-select';
import { EXIT, SKIP, visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { CrossReference } from 'myst-spec';
import LinkIcon from '@heroicons/react/outline/LinkIcon';
import ExternalLinkIcon from '@heroicons/react/outline/ExternalLinkIcon';
import { useReferences, useXRefState, XRefProvider } from '@curvenote/ui-providers';
import { useParse } from '.';
import { InlineError } from './inlineError';
import type { NodeRenderer } from './types';
import { ClickPopover } from './components/ClickPopover';
import useSWR from 'swr';
import { Link } from '@remix-run/react';

const MAX_NODES = 3; // Max nodes to show after a header

function selectMdastNodes(mdast: Root, identifier: string) {
  const identifiers = selectAll(`[identifier=${identifier}],[key=${identifier}]`, mdast);
  const container = identifiers.filter(({ type }) => type === 'container' || type === 'math')[0];
  const nodes = container ? [container] : [];
  if (nodes.length === 0 && identifiers.length > 0 && mdast) {
    let begin = false;
    visit(mdast, (node) => {
      if ((begin && node.type === 'heading') || nodes.length >= MAX_NODES) {
        return EXIT;
      }
      if ((node as any).identifier === identifier && node.type === 'heading') begin = true;
      if (begin) {
        nodes.push(node);
        return SKIP; // Don't traverse the children
      }
    });
  }
  if (nodes.length === 0 && identifiers.length > 0) {
    // If we haven't found anything, push the first identifier
    nodes.push(identifiers[0]);
  }
  return nodes;
}

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => {
    if (res.status === 200) return res.json();
    throw new Error(`Content returned with status ${res.status}.`);
  });

export function ReferencedContent({
  identifier,
  close,
}: {
  identifier: string;
  close: () => void;
}) {
  const { remote, url } = useXRefState();
  const external = url?.startsWith('http') ?? false;
  const lookupUrl = external ? `/api/lookup?url=${url}.json` : `${url}.json`;
  const { data, error } = useSWR(remote ? lookupUrl : null, fetcher);
  const references = useReferences();
  const mdast = data?.mdast ?? references?.article;
  const nodes = selectMdastNodes(mdast, identifier);
  const htmlId = (nodes[0] as any)?.html_id || (nodes[0] as any)?.identifier;
  const link = `${url}${htmlId ? `#${htmlId}` : ''}`;
  const onClose = () => {
    // Need to close it first because the ID is on the page twice ...
    close();
    setTimeout(() => {
      const el = document.getElementById(htmlId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 10);
  };
  const children = useParse({ type: 'block', children: nodes });
  if (remote && !data) {
    return <>Loading...</>;
  }
  if (remote && error) {
    return <>Error loading remote page.</>;
  }
  if (!nodes || nodes.length === 0) {
    return (
      <>
        <InlineError value={identifier || 'No Label'} message="Cross Reference Not Found" />
      </>
    );
  }
  return (
    <div className="exclude-from-outline">
      {remote && external && (
        <a href={link} className="absolute top-4 right-1" target="_blank">
          <ExternalLinkIcon className="w-4 h-4" />
        </a>
      )}
      {remote && !external && (
        <Link to={link} className="absolute top-4 right-1" prefetch="intent">
          <ExternalLinkIcon className="w-4 h-4" />
        </Link>
      )}
      {!remote && (
        <button onClick={onClose} className="absolute top-4 right-1">
          <LinkIcon className="w-4 h-4" />
        </button>
      )}
      <div className="popout">{children}</div>
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
        <XRefProvider remote={(node as any).remote} url={(node as any).url}>
          <ReferencedContent identifier={node.identifier as string} close={close} />
        </XRefProvider>
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

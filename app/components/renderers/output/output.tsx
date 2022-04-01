import { NodeRenderer } from 'myst-util-to-react';
import { OutputSummaryKind } from '@curvenote/blocks/dist/blocks/output';
import { DangerousHTML, MaybeLongContent } from './components';
import classNames from 'classnames';

const SUPORTED_KINDS = new Set([
  OutputSummaryKind.stream,
  OutputSummaryKind.image,
  OutputSummaryKind.error,
  OutputSummaryKind.text,
  // Both of these kinds are OK as **long as this is a static site**
  OutputSummaryKind.json,
  OutputSummaryKind.html,
]);

const PRIORITIZED_FALLBACK_KINDS = [OutputSummaryKind.image, OutputSummaryKind.text];

export const Output: NodeRenderer = (node) => {
  let outputComponent = null;

  let data:
    | { kind: string; content: string; content_type?: string; path?: string }
    | undefined;
  if (SUPORTED_KINDS.has(node.data.kind)) {
    // The kind is the default if it is supported here!
    data = node.data.items[node.data.kind];
  } else {
    // if we don't support the primary kind, try and find a fallback
    PRIORITIZED_FALLBACK_KINDS.forEach((kind) => {
      if (!data && node.data.items[kind]) data = node.data.items[kind];
    });
  }

  switch (data?.kind) {
    case OutputSummaryKind.image:
      outputComponent = <img src={`${data.path}`} />;
      break;
    case OutputSummaryKind.error:
      outputComponent = (
        <MaybeLongContent
          {...data}
          render={(content: string) => <div className="bg-red-500">{content}</div>}
        />
      );
      break;
    case OutputSummaryKind.text:
      outputComponent = (
        <MaybeLongContent {...data} render={(content: string) => <p>{content}</p>} />
      );
      break;
    case OutputSummaryKind.stream:
    case OutputSummaryKind.json:
      outputComponent = (
        <MaybeLongContent
          {...data}
          render={(content: string) => (
            <pre className="max-h-[20em] overflow-scroll">{content}</pre>
          )}
        />
      );
      break;
    case OutputSummaryKind.html:
      outputComponent = (
        <MaybeLongContent
          {...data}
          render={(content: string) => <DangerousHTML content={content} />}
        />
      );
      break;
    default:
      console.log(node.data);
      console.log(`Missing output: ${node.data.kind}`);
  }

  return (
    <figure
      key={node.key}
      id={node.identifier || undefined}
      className={classNames('max-w-full overflow-scroll', {
        'text-left': !node.align || node.align === 'left',
        'text-center': node.align === 'center',
        'text-right': node.align === 'right',
      })}
    >
      <div className="relative block" style={{ width: `${node.width || 100}%` }}>
        {outputComponent}
      </div>
    </figure>
  );
};

export const outputRenderers = {
  output: Output,
};

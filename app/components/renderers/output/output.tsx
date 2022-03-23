import { GenericNode } from 'mystjs';
import { OutputSummaryKind } from '@curvenote/blocks';
import { HTMLOutput } from './html';

const SUPORTED_KINDS = new Set([
  OutputSummaryKind.stream,
  OutputSummaryKind.image,
  OutputSummaryKind.error,
  OutputSummaryKind.text,
  OutputSummaryKind.json,
  OutputSummaryKind.html,
]);

const PRIORITIZED_FALLBACK_KINDS = [OutputSummaryKind.image, OutputSummaryKind.text];

export const Output = (node: GenericNode) => {
  let outputComponent = null;

  console.log(node.data);

  let data: any;
  if (!SUPORTED_KINDS.has(node.data.kind)) {
    console.log('looking for fallback');
    // if we don't support the primary kind, try and find a fallback
    PRIORITIZED_FALLBACK_KINDS.forEach((kind) => {
      if (!data && node.data.items[kind]) data = node.data.items[kind];
    });
    console.log(data);
  } else data = node.data.items[node.data.kind];

  switch (data.kind) {
    case OutputSummaryKind.image:
      outputComponent = <img src={`${data.path}`} />;
      break;
    case OutputSummaryKind.error:
      outputComponent = <div style={{ backgroundColor: 'salmon' }}>{data.content}</div>;
      break;
    case OutputSummaryKind.stream:
    case OutputSummaryKind.text:
    case OutputSummaryKind.json:
      outputComponent = <pre>{data.content}</pre>;
      break;
    case OutputSummaryKind.html:
      {
        outputComponent = <HTMLOutput {...data} />;
      }
      break;
    default:
      outputComponent = (
        <div>
          [MISSING OUTPUT] {data.kind} | {data.content_type}
        </div>
      );
  }

  return (
    <figure
      key={node.key}
      id={node.label || undefined}
      style={{ textAlign: node.align || 'left' }}
    >
      <div
        style={{
          position: 'relative',
          display: 'block',
          width: `${node.width || 100}%`,
        }}
      >
        {outputComponent}
      </div>
    </figure>
  );
};

export const outputRenderers = {
  output: Output,
};

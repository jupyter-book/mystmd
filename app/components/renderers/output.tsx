import { GenericNode } from 'mystjs';
import { OutputSummaryKind } from '@curvenote/blocks';

export const Output = (node: GenericNode) => {
  let outputComponent = null;
  switch (node.data.kind) {
    case OutputSummaryKind.image:
      outputComponent = (
        <img src={`/${node.data.items[OutputSummaryKind.image].path}`} />
      );
      break;
    case OutputSummaryKind.error:
    case OutputSummaryKind.stream:
    case OutputSummaryKind.text:
    case OutputSummaryKind.json:
      outputComponent = <pre>{node.data.items[node.data.kind].content}</pre>;
      break;
    case OutputSummaryKind.html:
      outputComponent = (
        <div
          dangerouslySetInnerHTML={{ __html: node.data.items[node.data.kind].content }}
        />
      );
      break;
    default:
      outputComponent = (
        <div>
          `Unable to render ${node.data.items[node.data.kind].kind} |
          {node.data.items[node.data.kind].content_type}`
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

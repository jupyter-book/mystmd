import { NodeRenderer } from 'myst-util-to-react';
import { OutputSummaryKind } from '@curvenote/blocks/dist/blocks/output';
import classNames from 'classnames';
import { SafeOutputs } from './safe';
import { NativeJupyterOutputs as JupyterOutputs } from './jupyter';
import { OutputSummary } from './hooks';

const RENDER_DIRECTLY = new Set([
  OutputSummaryKind.stream,
  OutputSummaryKind.image,
  OutputSummaryKind.text,
]);

export function Output(node: GenericNode) {
  const data: OutputSummary[] = node.data;

  const allSafe = data.reduce(
    (flag, output) => flag && RENDER_DIRECTLY.has(output.kind),
    true,
  );

  let component;
  if (allSafe) {
    component = <SafeOutputs keyStub={node.key} data={node.data} />;
  } else {
    component = <JupyterOutputs summaries={node.data} />;
  }

  return (
    <figure
      key={node.key}
      id={node.identifier || undefined}
      className={classNames('max-w-full overflow-auto', {
        'text-left': !node.align || node.align === 'left',
        'text-center': node.align === 'center',
        'text-right': node.align === 'right',
      })}
    >
      {component}
    </figure>
  );
}

export const outputRenderers = {
  output: Output,
};

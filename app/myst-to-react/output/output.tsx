import type { GenericNode } from 'mystjs';
import { KnownCellOutputMimeTypes } from '@curvenote/blocks/dist/blocks/types/jupyter';
import { MinifiedMimeOutput, MinifiedOutput } from '@curvenote/nbtx/dist/minify/types';
import classNames from 'classnames';
import { SafeOutputs } from './safe';
import { NativeJupyterOutputs as JupyterOutputs } from './jupyter';

const DIRECT_OUTPUT_TYPES = new Set(['stream']);

const DIRECT_MIME_TYPES = new Set([
  KnownCellOutputMimeTypes.TextPlain,
  KnownCellOutputMimeTypes.ImagePng,
  KnownCellOutputMimeTypes.ImageGif,
  KnownCellOutputMimeTypes.ImageJpeg,
  KnownCellOutputMimeTypes.ImageBmp,
]) as Set<string>;

export function allOutputsAreSafe(
  outputs: MinifiedOutput[],
  directOutputTypes: Set<string>,
  directMimeTypes: Set<string>,
) {
  return outputs.reduce((flag, output) => {
    const safe =
      directOutputTypes.has(output.output_type) ||
      ('data' in output &&
        Boolean(output.data) &&
        Object.keys((output as MinifiedMimeOutput).data).every((mimetype) =>
          directMimeTypes.has(mimetype),
        ));
    return flag && safe;
  }, true);
}

export function Output(node: GenericNode) {
  const outputs: MinifiedOutput[] = node.data;
  const allSafe = allOutputsAreSafe(outputs, DIRECT_OUTPUT_TYPES, DIRECT_MIME_TYPES);

  let component;
  if (allSafe) {
    component = <SafeOutputs keyStub={node.key} outputs={outputs} />;
  } else {
    component = <JupyterOutputs id={node.key} outputs={outputs} />;
  }

  return (
    <figure
      suppressHydrationWarning={!allSafe}
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

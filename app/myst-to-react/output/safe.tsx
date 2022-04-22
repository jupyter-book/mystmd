import { KnownCellOutputMimeTypes } from '@curvenote/blocks/dist/blocks/types/jupyter';
import { ensureString } from '@curvenote/blocks/dist/helpers';
import type {
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
} from '@curvenote/nbtx/dist/minify/types';
import { MaybeLongContent } from './components';

/**
 * https://jupyterbook.org/content/code-outputs.html#render-priority
 * 
 * nb_render_priority:
      html:
      - "application/vnd.jupyter.widget-view+json"
      - "application/javascript"
      - "text/html"
      - "image/svg+xml"
      - "image/png"
      - "image/jpeg"
      - "text/markdown"
      - "text/latex"
      - "text/plain"
 */

const RENDER_PRIORITY = [
  KnownCellOutputMimeTypes.ImagePng,
  KnownCellOutputMimeTypes.ImageJpeg,
  KnownCellOutputMimeTypes.ImageGif,
  KnownCellOutputMimeTypes.ImageBmp,
];

function findSafeMimeOutputs(output: MinifiedOutput): {
  image?: MinifiedMimePayload;
  text?: MinifiedMimePayload;
} {
  const data: MinifiedMimeBundle = output.data as MinifiedMimeBundle;
  const image = RENDER_PRIORITY.reduce(
    (acc: MinifiedMimePayload | undefined, mimetype) => {
      if (acc) return acc;
      if (data && data[mimetype]) return data[mimetype];
    },
    undefined,
  );
  const text = data && data['text/plain'];
  return { image, text };
}

function OutputImage({
  image,
  text,
}: {
  image: MinifiedMimePayload;
  text?: MinifiedMimePayload;
}) {
  return <img src={image?.path} alt={text?.content ?? 'Image produced in Jupyter'} />;
}

function SafeOutput({ output }: { output: MinifiedOutput }) {
  switch (output.output_type) {
    case 'stream':
      return (
        <MaybeLongContent
          content={ensureString(output.text)}
          path={output.path}
          render={(content?: string) => <div>{content}</div>}
        />
      );
    case 'display_data':
    case 'execute_result':
    case 'update_display_data': {
      const { image, text } = findSafeMimeOutputs(output);
      if (!image && !text) return null;
      if (image) return <OutputImage image={image} text={text} />;
      if (text) return <div>{text.content}</div>;
      return null;
    }
    default:
      console.warn(`Unknown output_type ${output['output_type']}`);
      return null;
  }
}

export function SafeOutputs({
  keyStub,
  outputs,
}: {
  keyStub: string;
  outputs: MinifiedOutput[];
}) {
  // TODO better key - add keys during content creation?
  const components = outputs.map((output, idx) => (
    <SafeOutput key={`${keyStub}-${idx}`} output={output} />
  ));
  return <>{components}</>;
}

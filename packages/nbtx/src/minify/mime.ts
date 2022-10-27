import type { IDisplayData, IExecuteResult, MultilineString } from '@jupyterlab/nbformat';
import { ensureString } from '@curvenote/blocks';
import type { IFileObjectFactoryFn } from '../files';
import type { MinifiedMimeBundle, MinifyOptions } from './types';
import { ensureSafePath } from './utils';

async function minifyContent(
  fileFactory: IFileObjectFactoryFn,
  content: string,
  contentType: string,
  isBase64Image: boolean,
  opts: MinifyOptions,
) {
  if (!isBase64Image && content && content.length <= opts.maxCharacters)
    return { content, content_type: contentType };
  const file = fileFactory(`${opts.basepath}-${ensureSafePath(contentType)}`);
  if (isBase64Image) {
    await file.writeBase64(content, contentType);
  } else {
    await file.writeString(content, contentType);
  }
  return {
    content: file.id,
    content_type: contentType,
    path: file.id,
  };
}

export async function minifyMimeOutput(
  fileFactory: IFileObjectFactoryFn,
  output: IDisplayData | IExecuteResult,
  opts: MinifyOptions,
) {
  const items = await Promise.all(
    Object.entries(output.data).map(async ([mimetype, content]) => {
      let isBase64Image = false;

      let stringContent = '';
      if (
        mimetype !== 'application/javascript' &&
        (mimetype === 'application/json' ||
          (mimetype.startsWith('application/') && typeof content === 'object'))
      ) {
        stringContent = JSON.stringify(content);
      } else {
        stringContent = ensureString(content as MultilineString | string);
      }

      if (!mimetype.startsWith('image/svg') && mimetype.startsWith('image/')) isBase64Image = true;

      // NOTE we insist on creating stringified content as this can / will end up in a
      // database with limited support for nested objects. Stringifcaiton here means
      // an inverse operation is needed on convertToIOutputs to get back to the original
      return minifyContent(fileFactory, stringContent, mimetype, isBase64Image, opts);
    }),
  );

  const data: MinifiedMimeBundle = items.reduce(
    (bundle, item) => ({ ...bundle, [item.content_type]: item }),
    {},
  );

  return {
    output_type: output.output_type,
    execution_count: output.execution_count as number | undefined,
    metadata: output.metadata,
    data,
  };
}

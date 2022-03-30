import { IDisplayData, IExecuteResult, MultilineString } from '@jupyterlab/nbformat';
import { ensureString } from '@curvenote/blocks';
import { IFileObjectFactoryFn } from '../files';
import { MinifiedMimeBundle, MinifyOptions } from './types';
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
    await file.writeBase64(content);
  } else {
    await file.writeString(content, 'text/plain');
  }
  return {
    content: `${content.slice(0, opts.truncateTo - 3)}...`,
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
      let stringContent = ensureString(content as MultilineString | string);
      if (mimetype.startsWith('application/')) stringContent = JSON.stringify(content);
      if (mimetype.startsWith('image/')) isBase64Image = true;
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

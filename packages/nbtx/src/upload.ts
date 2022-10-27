import { v4 as uuid } from 'uuid';
import type { TranslatedBlockPair } from './types';
import type { IFileObjectFactoryFn } from './files';

export const uploadOutputs = async (
  fileFactory: IFileObjectFactoryFn,
  blocks: TranslatedBlockPair[],
  basepath: string,
): Promise<TranslatedBlockPair[]> => {
  return Promise.all(
    blocks.map(async (pair) => {
      if (!pair.output) return pair;
      const upload_path = `${basepath}/${uuid()}`;
      const file = fileFactory(upload_path);
      if (!file.exists()) throw new Error(`Could not create file on storage - ${upload_path}`);
      await file.writeString(JSON.stringify(pair.output.original), 'application/json');

      return {
        ...pair,
        output: { ...pair.output, upload_path, original: undefined },
      } as TranslatedBlockPair;
    }),
  );
};

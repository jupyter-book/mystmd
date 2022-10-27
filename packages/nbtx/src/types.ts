import type { Blocks, JsonObject, PartialBlocks, TARGET } from '@curvenote/blocks';

export type AllowedTargets = TARGET.JupyterOutput;

export type FormattedData = {
  data: PartialBlocks.Output;
  links: JsonObject;
};

export interface TranslatedBlockPair {
  content: Blocks.Content | Blocks.Code;
  output?: Blocks.Output;
}

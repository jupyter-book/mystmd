import {
  JsonObject,
  OutputSummaryEntry,
  OutputSummaryKind,
  PartialBlocks,
  TARGET,
} from '@curvenote/blocks';

export type AllowedTargets = TARGET.JupyterOutput;

export type FormattedData = {
  data: PartialBlocks.Output;
  links: JsonObject;
};

export type OutputSummaries = {
  kind: OutputSummaryKind; // We may choose to delete this later, and decide at format time.
  items: Partial<Record<OutputSummaryKind, OutputSummaryEntry>>;
};

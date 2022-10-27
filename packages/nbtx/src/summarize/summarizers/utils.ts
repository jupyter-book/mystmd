import type {
  CellOutput,
  KnownCellOutputMimeTypes,
  DisplayData,
  ExecuteResult,
  OutputData,
} from '@curvenote/blocks';

export function dictHasOneOf<T extends Record<string, any>, I extends string>(
  dict: T,
  list: I[],
): boolean {
  return Object.keys(dict).reduce<boolean>((flag, k) => flag || list.indexOf(k as I) > -1, false);
}

export function stripTypesFromOutputData(
  item: DisplayData | ExecuteResult,
  keys: KnownCellOutputMimeTypes[],
): CellOutput {
  const stripped = keys.reduce<OutputData>((reduced, key) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [key]: _, ...rest } = reduced;
    return rest;
  }, item.data);
  return { ...item, data: stripped } as DisplayData | ExecuteResult;
}

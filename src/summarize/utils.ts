import {
  CellOutput,
  CellOutputMimeTypes,
  DisplayData,
  ExecuteResult,
  OutputData,
} from '@curvenote/blocks';

export function dictHasOneOf<T, I extends string>(dict: T, list: I[]): boolean {
  return Object.keys(dict).reduce<boolean>((flag, k) => flag || list.indexOf(k as I) > -1, false);
}

export function stripTypesFromOutputData(
  item: DisplayData | ExecuteResult,
  keys: CellOutputMimeTypes[],
): CellOutput {
  const stripped = keys.reduce<OutputData>((reduced, key) => {
    const { [key]: x, ...rest } = reduced;
    return rest;
  }, item.data);
  return { ...item, data: stripped } as DisplayData | ExecuteResult;
}

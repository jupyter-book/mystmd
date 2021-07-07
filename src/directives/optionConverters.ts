/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/** Functions for converting and validating directive options */

/** convert and validate an option value */
export type OptionSpecConverter = (value: any) => any

/** Adapted from docutils/nodes.py::make_id */
function make_id(name: string): string {
  // TODO make more complete
  return name
    .toLowerCase()
    .split(/\s+/)
    .join('-')
    .replace(/[^a-z0-9]+/, '-')
    .replace(/^[-0-9]+|-+$/, '')
}

export const unchanged = (value: any): any => value
export const class_option = (value: any): string[] => {
  return `${value || ''}`.split(/\s+/).map(name => make_id(name))
}

import type { Plugin } from 'unified';
import type { GenericNode, GenericParent, DirectiveSpec, RoleSpec } from 'myst-common';

type Select = (selector: string, tree?: GenericParent) => GenericNode | null;
type SelectAll = (selector: string, tree?: GenericParent) => GenericNode[] | null;

export type PluginUtils = { select: Select; selectAll: SelectAll };
export type PluginOptions = Record<string, any>;

export type TransformSpec = {
  name: string;
  doc?: string;
  stage: 'document' | 'project';
  // context?: 'tex' | 'docx' | 'jats' | 'typst' | 'site';
  plugin: Plugin<
    [PluginOptions | undefined, PluginUtils],
    GenericParent,
    GenericParent | Promise<GenericParent>
  >;
};

/**
 * Create MyST plugins that export this from a file,
 * or combine multiple plugins to a single object.
 */
export type MystPlugin = {
  name?: string;
  author?: string;
  license?: string;
  directives?: DirectiveSpec[];
  roles?: RoleSpec[];
  transforms?: TransformSpec[];
};

export type ValidatedMystPlugin = Required<
  Pick<MystPlugin, 'directives' | 'roles' | 'transforms'>
> & {
  paths: string[];
};


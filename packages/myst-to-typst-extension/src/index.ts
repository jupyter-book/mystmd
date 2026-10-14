import { type IPlugin } from '@lumino/coreutils';
import type { IApp } from 'myst-common';
import plugin, { IMystToTypst } from 'myst-to-typst';

/**
 * A plugin that *provides* the `IMystToTypst` plugin.
 */
const extension: IPlugin<IApp, IMystToTypst> = {
  id: 'myst-to-typst:default-plugin',
  autoStart: false,
  provides: IMystToTypst,
  activate: (app: IApp): IMystToTypst => {
    console.log('[myst-to-typst] Providing core IMystToTypst');
    return plugin;
  },
};
export default extension;

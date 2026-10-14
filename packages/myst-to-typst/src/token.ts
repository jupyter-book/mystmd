import { Token } from '@lumino/coreutils';
import plugin from './index.js';

export type IMystToTypst = typeof plugin;

/**
 * The token used to provide and require the {@link IMystToTypst} plugin.
 *
 */
export const IMystToTypst = new Token<IMystToTypst>('myst-to-typst:IMystToTypst');

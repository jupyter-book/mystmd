import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type { VFile } from 'vfile';

export function stateWarn(state: StateCore, message: string) {
  const vfile = state.env.vfile as VFile | undefined;
  if (!vfile) return;
  return vfile.message(message);
}

export function stateError(state: StateCore, message: string) {
  const out = stateWarn(state, message);
  if (out) out.fatal = true;
  return out;
}

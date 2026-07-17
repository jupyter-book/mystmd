import type StateCore from 'markdown-it/lib/rules_core/state_core.js';
import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';

export function stateWarn(state: StateCore, message: string): VFileMessage | undefined {
  const vfile = state.env.vfile as VFile | undefined;
  if (!vfile) return;
  return vfile.message(message);
}

export function stateError(state: StateCore, message: string) {
  const out = stateWarn(state, message);
  if (out) out.fatal = true;
  return out;
}

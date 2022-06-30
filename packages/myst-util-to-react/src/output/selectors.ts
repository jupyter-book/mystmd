import { host, HostState } from '@curvenote/connect';

export interface State {
  app: HostState;
}

export const selectIFrameHeight = (state: State, id: string) =>
  host.selectors.selectIFrameSize(state.app, id);

export const selectIFrameReady = (state: State, id: string) =>
  host.selectors.selectIFrameReady(state.app, id);

export const selectIFrameSendFailed = (state: State, id: string) =>
  host.selectors.selectIFrameFailed(state.app, id);

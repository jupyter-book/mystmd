import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import type { types } from '@curvenote/runtime';
import runtime from '@curvenote/runtime';
import type { HostState } from '@curvenote/connect';
import { host } from '@curvenote/connect';

export interface State {
  runtime: types.State;
  app: HostState;
}

export default function create() {
  return createStore(
    combineReducers({
      runtime: runtime.reducer,
      app: host.reducer,
    }),
    applyMiddleware(thunkMiddleware, runtime.triggerEvaluate, runtime.dangerousEvaluatation),
  );
}

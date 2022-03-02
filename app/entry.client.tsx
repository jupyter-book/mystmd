import { hydrate } from 'react-dom';
import { RemixBrowser } from 'remix';

import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunkMiddleware from 'redux-thunk';
import runtime, { types } from '@curvenote/runtime';
import { register } from '@curvenote/components';

declare global {
  interface Window {
    curvenote: {
      store: types.Store;
    };
  }
}

window.curvenote = {
  ...window.curvenote,
  store: createStore(
    combineReducers({ runtime: runtime.reducer }),
    applyMiddleware(
      thunkMiddleware,
      runtime.triggerEvaluate,
      runtime.dangerousEvaluatation,
    ),
  ) as types.Store,
};

register(window.curvenote.store);

hydrate(<RemixBrowser />, document);

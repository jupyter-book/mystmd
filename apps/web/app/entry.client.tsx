import { hydrate } from 'react-dom';
import { RemixBrowser } from '@remix-run/react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';
import type { types } from '@curvenote/runtime';
import { register } from '@curvenote/components';
import { host } from '@curvenote/connect';

import createStore from './store';

declare global {
  interface Window {
    curvenote: {
      store: Store;
    };
  }
}

const store = createStore();

window.curvenote = {
  ...window.curvenote,
  store,
};

register(store as types.Store);
host.registerMessageListener(window.curvenote.store);

hydrate(
  <Provider store={store}>
    <RemixBrowser />
  </Provider>,
  document,
);

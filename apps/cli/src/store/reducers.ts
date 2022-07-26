import { combineReducers } from 'redux';
import { apiReducer } from './api/reducers';
import { localReducer } from './local/reducers';
import { buildReducer } from './build/reducers';

export const rootReducer = combineReducers({
  api: apiReducer,
  local: localReducer,
  build: buildReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

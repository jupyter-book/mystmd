import { combineReducers } from 'redux';
import { apiReducer } from './api/reducers';
import { localReducer } from './local/reducers';

export const rootReducer = combineReducers({
  api: apiReducer,
  local: localReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

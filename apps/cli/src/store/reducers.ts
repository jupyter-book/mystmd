import { combineReducers } from 'redux';
import { localReducer } from 'myst-cli';
import { apiReducer } from './api/reducers';
import { oxalink } from './oxa/reducers';

export const rootReducer = combineReducers({
  api: apiReducer,
  local: localReducer,
  oxalink: oxalink.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

import { combineReducers } from 'redux';
import { apiReducer } from './api/reducers';

export const rootReducer = combineReducers({
  api: apiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

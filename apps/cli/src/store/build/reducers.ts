import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import type { BuildWarning, ExternalLinkResult } from './types';

export const links = createSlice({
  name: 'links',
  initialState: {} as Record<string, ExternalLinkResult>,
  reducers: {
    updateLink(state, action: PayloadAction<ExternalLinkResult>) {
      const { url, ok, skipped, status, statusText } = action.payload;
      state[url] = { url, ok, skipped, status, statusText };
    },
  },
});

export const warnings = createSlice({
  name: 'warnings',
  initialState: {} as Record<string, BuildWarning[]>,
  reducers: {
    addWarning(state, action: PayloadAction<{ file: string } & BuildWarning>) {
      const { file, message, kind } = action.payload;
      state[file] = [...(state[file] ?? []), { message, kind }];
    },
    clearWarnings(state, action: PayloadAction<{ file: string }>) {
      state[action.payload.file] = [];
    },
    clearAllWarnings(state) {
      Object.keys(state).forEach((key) => {
        delete state[key];
      });
    },
  },
});

export const buildReducer = combineReducers({
  links: links.reducer,
  warnings: warnings.reducer,
});

export type BuildState = ReturnType<typeof buildReducer>;

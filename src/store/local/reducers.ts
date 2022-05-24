import { dirname } from 'path';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import { ProjectConfig, SiteConfig, LocalProject } from '../../types';

export const projects = createSlice({
  name: 'projects',
  initialState: {} as Record<string, LocalProject>,
  reducers: {
    recieve(state, action: PayloadAction<LocalProject>) {
      state[action.payload.path] = action.payload;
    },
  },
});

export const config = createSlice({
  name: 'config',
  initialState: { projects: {} } as { site?: SiteConfig; projects: Record<string, ProjectConfig> },
  reducers: {
    recieveSite(state, action: PayloadAction<SiteConfig>) {
      state.site = action.payload;
    },
    recieveProject(state, action: PayloadAction<ProjectConfig & { path: string }>) {
      const { path, ...payload } = action.payload;
      state.projects[path] = payload;
    },
  },
});

export const localReducer = combineReducers({
  projects: projects.reducer,
  config: config.reducer,
});

export type LocalState = ReturnType<typeof localReducer>;

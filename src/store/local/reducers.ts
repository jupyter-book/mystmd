import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { ProjectConfig, SiteConfig, SiteProject, LocalProject } from '../../types';

export const projects = createSlice({
  name: 'projects',
  initialState: {} as Record<string, LocalProject>,
  reducers: {
    receive(state, action: PayloadAction<LocalProject>) {
      state[action.payload.path] = action.payload;
    },
  },
});

export const config = createSlice({
  name: 'config',
  initialState: { projects: {} } as { site?: SiteConfig; projects: Record<string, ProjectConfig> },
  reducers: {
    receiveSite(state, action: PayloadAction<SiteConfig>) {
      state.site = action.payload;
    },
    receiveSiteProject(state, action: PayloadAction<SiteProject>) {
      if (!state.site)
        throw new Error('state.local.site is not defined, not executing "receiveSiteProject"');
      state.site.projects.push(action.payload);
    },
    receiveProject(state, action: PayloadAction<ProjectConfig & { path: string }>) {
      const { path, ...payload } = action.payload;
      state.projects[path] = payload;
    },
  },
});

type WatchedFile = {
  dirty?: true;
  processed: boolean;
  project: { path: string; slug: string };
  file: { path: string; slug: string };
  // data?: RendererData;
};
type WatchState = { startup: boolean; files: Record<string, WatchedFile> };

export const watch = createSlice({
  name: 'watch',
  initialState: { startup: false, files: {} } as WatchState,
  reducers: {
    setStartupPass(state, action: PayloadAction<boolean>) {
      state.startup = action.payload;
    },
    registerFile(state, action: PayloadAction<WatchedFile>) {
      state.files[action.payload.file.path] = action.payload;
    },
  },
});

export const localReducer = combineReducers({
  projects: projects.reducer,
  config: config.reducer,
  watch: watch.reducer,
});

export type LocalState = ReturnType<typeof localReducer>;

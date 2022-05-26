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
  title?: string | null;
  description?: string | null;
  sha256?: string | null;
};
type WatchState = {
  linkLookup: Record<string, { path: string; url: string }>;
  files: Record<string, WatchedFile>;
};

export const watch = createSlice({
  name: 'watch',
  initialState: { linkLookup: {}, files: {} } as WatchState,
  reducers: {
    markFileChanged(state, action: PayloadAction<{ path: string; sha256?: string }>) {
      const { path, sha256 = null } = action.payload;
      state.files[path] = { ...state.files[path], sha256 };
    },
    updateFileInfo(
      state,
      action: PayloadAction<{
        path: string;
        title?: string | null;
        description?: string | null;
        sha256?: string;
      }>,
    ) {
      const { path, sha256, title, description } = action.payload;
      if (title) state.files[path].title = title;
      if (description) state.files[path].description = description;
      if (sha256) state.files[path].sha256 = sha256;
    },
    updateLinkInfo(
      state,
      action: PayloadAction<{
        path: string;
        oxa: string;
        url: string;
      }>,
    ) {
      const { oxa, path, url } = action.payload;
      state.linkLookup[oxa] = { path, url };
    },
  },
});

export const localReducer = combineReducers({
  projects: projects.reducer,
  config: config.reducer,
  watch: watch.reducer,
});

export type LocalState = ReturnType<typeof localReducer>;

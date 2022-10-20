import { resolve } from 'path';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ProjectConfig, SiteConfig } from 'myst-config';
import { combineReducers } from 'redux';
import type { BuildWarning, ExternalLinkResult } from './types';
import type { LocalProject } from '../project/types';

export const projects = createSlice({
  name: 'projects',
  initialState: {} as Record<string, LocalProject>,
  reducers: {
    receive(state, action: PayloadAction<LocalProject>) {
      state[resolve(action.payload.path)] = action.payload;
    },
  },
});

export const affiliations = createSlice({
  name: 'affiliations',
  initialState: {} as Record<string, string>,
  reducers: {
    receive(state, action: PayloadAction<{ affiliations: { id: string; text: string }[] }>) {
      action.payload.affiliations.forEach((aff) => {
        state[aff.id] = aff.text;
      });
    },
  },
});

export const config = createSlice({
  name: 'config',
  initialState: { rawConfigs: {}, projects: {}, sites: {} } as {
    currentProjectPath: string;
    currentSitePath: string;
    rawConfigs: Record<string, Record<string, any>>;
    projects: Record<string, ProjectConfig & { file: string }>;
    sites: Record<string, SiteConfig & { file: string }>;
  },
  reducers: {
    receiveCurrentProjectPath(state, action: PayloadAction<{ path: string }>) {
      state.currentProjectPath = resolve(action.payload.path);
    },
    receiveCurrentSitePath(state, action: PayloadAction<{ path: string }>) {
      state.currentSitePath = resolve(action.payload.path);
    },
    receiveRawConfig(
      state,
      action: PayloadAction<Record<string, any> & { path: string; file: string }>,
    ) {
      const { path, ...payload } = action.payload;
      state.rawConfigs[resolve(path)] = payload;
    },
    receiveSiteConfig(state, action: PayloadAction<SiteConfig & { path: string; file: string }>) {
      const { path, ...payload } = action.payload;
      state.sites[resolve(path)] = payload;
    },
    receiveProjectConfig(
      state,
      action: PayloadAction<ProjectConfig & { path: string; file: string }>,
    ) {
      const { path, ...payload } = action.payload;
      state.projects[resolve(path)] = payload;
    },
  },
});

type WatchedFile = {
  title?: string | null;
  description?: string | null;
  date?: string | null;
  thumbnail?: string | null;
  thumbnailOptimized?: string | null;
  tags?: string[] | null;
  sha256?: string | null;
  url?: string | null;
};

export const watch = createSlice({
  name: 'watch',
  initialState: { files: {} } as { files: Record<string, WatchedFile> },
  reducers: {
    markFileChanged(state, action: PayloadAction<{ path: string; sha256?: string }>) {
      const { path, sha256 = null } = action.payload;
      state.files[resolve(path)] = { ...state.files[resolve(path)], sha256 };
    },
    updateFileInfo(
      state,
      action: PayloadAction<{
        path: string;
        title?: string | null;
        description?: string | null;
        date?: string | null;
        thumbnail?: string | null;
        thumbnailOptimized?: string;
        tags?: string[] | null;
        sha256?: string;
        url?: string;
      }>,
    ) {
      const { path, sha256, title, description, date, thumbnail, thumbnailOptimized, tags, url } =
        action.payload;
      const resolvedPath = resolve(path);
      if (title) state.files[resolvedPath].title = title;
      if (description) state.files[resolvedPath].description = description;
      if (date) state.files[resolvedPath].date = date;
      if (thumbnail) state.files[resolvedPath].thumbnail = thumbnail;
      if (thumbnailOptimized) state.files[resolvedPath].thumbnailOptimized = thumbnailOptimized;
      if (tags) state.files[resolvedPath].tags = [...tags];
      if (sha256) state.files[resolvedPath].sha256 = sha256;
      if (url) state.files[resolvedPath].url = url;
    },
  },
});

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

export const localReducer = combineReducers({
  projects: projects.reducer,
  affiliations: affiliations.reducer,
  config: config.reducer,
  watch: watch.reducer,
  links: links.reducer,
  warnings: warnings.reducer,
});

export const rootReducer = combineReducers({
  local: localReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

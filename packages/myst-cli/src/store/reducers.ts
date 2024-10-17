import { resolve } from 'node:path';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ProjectConfig, SiteConfig } from 'myst-config';
import { combineReducers } from 'redux';
import type { BuildWarning, ExternalLinkResult, ValidatedRawConfig } from './types.js';
import type { LocalProject } from '../project/types.js';

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
  initialState: {
    rawConfigs: {},
    projects: {},
    projectParts: {},
    fileParts: {},
    sites: {},
    filenames: {},
  } as {
    currentProjectPath: string | undefined;
    currentSitePath: string | undefined;
    rawConfigs: Record<string, { raw: Record<string, any>; validated: ValidatedRawConfig }>;
    projects: Record<string, Record<string, any>>;
    projectParts: Record<string, string[]>;
    fileParts: Record<string, string[]>;
    sites: Record<string, Record<string, any>>;
    filenames: Record<string, string>;
    configExtensions?: string[];
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
      action: PayloadAction<{
        raw: Record<string, any>;
        validated: ValidatedRawConfig;
        path: string;
        file: string;
      }>,
    ) {
      const { path, file, ...payload } = action.payload;
      state.rawConfigs[resolve(path)] = payload;
      state.filenames[resolve(path)] = file;
    },
    receiveSiteConfig(state, action: PayloadAction<SiteConfig & { path: string }>) {
      const { path, ...payload } = action.payload;
      state.sites[resolve(path)] = payload;
    },
    receiveProjectConfig(state, action: PayloadAction<ProjectConfig & { path: string }>) {
      const { path, ...payload } = action.payload;
      state.projects[resolve(path)] = payload;
    },
    receiveConfigExtension(state, action: PayloadAction<{ file: string }>) {
      state.configExtensions ??= [];
      state.configExtensions.push(action.payload.file);
    },
    receiveProjectPart(state, action: PayloadAction<{ partFile: string; path: string }>) {
      const { path, partFile } = action.payload;
      const partFiles = state.projectParts[resolve(path)] ?? [];
      if (!partFiles.includes(partFile)) {
        state.projectParts[resolve(path)] = [...partFiles, partFile];
      }
    },
    receiveFilePart(state, action: PayloadAction<{ partFile: string; file: string }>) {
      const { file, partFile } = action.payload;
      const partFiles = state.fileParts[resolve(file)] ?? [];
      if (!partFiles.includes(partFile)) {
        state.fileParts[resolve(file)] = [...partFiles, partFile];
      }
    },
  },
});

type WatchedFile = {
  title?: string | null;
  short_title?: string | null;
  description?: string | null;
  date?: string | null;
  thumbnail?: string | null;
  thumbnailOptimized?: string | null;
  banner?: string | null;
  bannerOptimized?: string | null;
  tags?: string[] | null;
  sha256?: string | null;
  url?: string | null;
  dataUrl?: string | null;
  localDependencies?: string[] | null;
};

export const watch = createSlice({
  name: 'watch',
  initialState: { files: {}, reloading: false } as {
    files: Record<string, WatchedFile>;
    reloading: boolean;
    reloadRequested: boolean;
  },
  reducers: {
    markReloading(state, action: PayloadAction<boolean>) {
      state.reloading = action.payload;
    },
    markReloadRequested(state, action: PayloadAction<boolean>) {
      state.reloadRequested = action.payload;
    },
    markFileChanged(state, action: PayloadAction<{ path: string; sha256?: string }>) {
      const { path, sha256 = null } = action.payload;
      state.files[resolve(path)] = { ...state.files[resolve(path)], sha256 };
    },
    addLocalDependency(state, action: PayloadAction<{ path: string; dependency: string }>) {
      const { path, dependency } = action.payload;
      if (!state.files[resolve(path)]) state.files[resolve(path)] = {};
      const existingDeps = [...(state.files[resolve(path)].localDependencies ?? [])];
      if (!existingDeps.includes(dependency)) {
        state.files[resolve(path)].localDependencies = [...existingDeps, dependency];
      }
    },
    updateFileInfo(
      state,
      action: PayloadAction<{
        path: string;
        title?: string | null;
        short_title?: string | null;
        description?: string | null;
        date?: string | null;
        thumbnail?: string | null;
        thumbnailOptimized?: string;
        banner?: string | null;
        bannerOptimized?: string | null;
        tags?: string[] | null;
        sha256?: string;
        url?: string;
        dataUrl?: string;
      }>,
    ) {
      const {
        path,
        sha256,
        title,
        short_title,
        description,
        date,
        thumbnail,
        thumbnailOptimized,
        banner,
        bannerOptimized,
        tags,
        url,
        dataUrl,
      } = action.payload;
      const resolvedPath = resolve(path);
      if (!state.files[resolvedPath]) state.files[resolvedPath] = {};
      if (title) state.files[resolvedPath].title = title;
      if (short_title) state.files[resolvedPath].short_title = short_title;
      if (description) state.files[resolvedPath].description = description;
      if (date) state.files[resolvedPath].date = date;
      if (thumbnail) state.files[resolvedPath].thumbnail = thumbnail;
      if (thumbnailOptimized) state.files[resolvedPath].thumbnailOptimized = thumbnailOptimized;
      if (banner) state.files[resolvedPath].banner = banner;
      if (bannerOptimized) state.files[resolvedPath].bannerOptimized = bannerOptimized;
      if (tags) state.files[resolvedPath].tags = [...tags];
      if (sha256) state.files[resolvedPath].sha256 = sha256;
      if (url) state.files[resolvedPath].url = url;
      if (dataUrl) state.files[resolvedPath].dataUrl = dataUrl;
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
      const { file, message, kind, url, note, position, ruleId } = action.payload;
      state[file] = [...(state[file] ?? []), { message, kind, url, note, position, ruleId }];
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

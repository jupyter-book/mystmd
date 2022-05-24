import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import {
  ProjectConfig,
  SiteConfig,
  SiteProject,
  LocalProject,
  SiteAction,
  SiteNavItem,
  Frontmatter,
} from '../../types';

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
      state.site.projects.push(action.payload);
    },
    receiveSiteMetadata(
      state,
      action: PayloadAction<{
        title?: string;
        frontmatter?: Frontmatter;
        logo?: string;
        logoText?: string;
        twitter?: string;
        domains?: string[];
        projects?: SiteProject[];
        nav?: SiteNavItem[];
        actions?: SiteAction[];
      }>,
    ) {
      const { payload } = action;
      if (payload.title) state.site.title = payload.title;
      if (payload.frontmatter) state.site.frontmatter = payload.frontmatter;
      if (payload.logo) state.site.logo = payload.logo;
      if (payload.logoText) state.site.logoText = payload.logoText;
      if (payload.twitter) state.site.twitter = payload.twitter;
      if (payload.domains) state.site.domains = payload.domains;
      if (payload.projects) state.site.projects = payload.projects;
      if (payload.nav) state.site.nav = payload.nav;
      if (payload.actions) state.site.actions = payload.actions;
    },
    receiveProject(state, action: PayloadAction<ProjectConfig & { path: string }>) {
      const { path, ...payload } = action.payload;
      state.projects[path] = payload;
    },
    receiveProjectMetadata(
      state,
      action: PayloadAction<{
        title?: string;
        frontmatter?: Frontmatter;
        remote?: string;
        index?: string;
        exclude?: string[];
        path: string;
      }>,
    ) {
      const { payload } = action;
      if (payload.title) state.projects[payload.path].title = payload.title;
      if (payload.frontmatter) state.projects[payload.path].frontmatter = payload.frontmatter;
      if (payload.remote) state.projects[payload.path].remote = payload.remote;
      if (payload.index) state.projects[payload.path].index = payload.index;
      if (payload.exclude) state.projects[payload.path].exclude = payload.exclude;
    },
  },
});

export const localReducer = combineReducers({
  projects: projects.reducer,
  config: config.reducer,
});

export type LocalState = ReturnType<typeof localReducer>;

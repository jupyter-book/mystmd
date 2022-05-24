import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import { ProjectConfig, SiteConfig, SiteProject, LocalProject, Frontmatter } from '../../types';

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
      if (!state.site) {
        // eslint-disable-next-line no-console
        console.error('state.site is not defined, not executing "receiveSiteProject"');
        return;
      }
      state.site.projects.push(action.payload);
    },
    receiveSiteMetadata(state, action: PayloadAction<Partial<SiteConfig>>) {
      const { payload } = action;
      state.site = {
        title: payload.title ?? state.site?.title ?? '',
        frontmatter: payload.frontmatter ?? state.site?.frontmatter,
        logo: payload.logo ?? state.site?.logo,
        logoText: payload.logoText ?? state.site?.logoText,
        twitter: payload.twitter ?? state.site?.twitter,
        domains: payload.domains ?? state.site?.domains ?? [],
        projects: payload.projects ?? state.site?.projects ?? [],
        nav: payload.nav ?? state.site?.nav ?? [],
        actions: payload.actions ?? state.site?.actions ?? [],
      };
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

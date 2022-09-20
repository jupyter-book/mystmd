import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import type {
  User as UserDTO,
  Team as TeamDTO,
  Project as ProjectDTO,
  SiteConfigDBO as SiteConfigDTO,
  Block as BlockDTO,
  Draft as DraftDTO,
  ALL_BLOCKS,
  TemplateSpec,
} from '@curvenote/blocks';
import { blockIdToString, versionIdToString, draftIdToString } from '@curvenote/blocks';

export const users = createSlice({
  name: 'users',
  initialState: {} as Record<string, UserDTO>,
  reducers: {
    receive(state, action: PayloadAction<UserDTO>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const teams = createSlice({
  name: 'teams',
  initialState: {} as Record<string, TeamDTO>,
  reducers: {
    receive(state, action: PayloadAction<TeamDTO>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const projects = createSlice({
  name: 'projects',
  initialState: {} as Record<string, ProjectDTO>,
  reducers: {
    receive(state, action: PayloadAction<ProjectDTO>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const siteconfigs = createSlice({
  name: 'siteconfigs',
  initialState: {} as Record<string, SiteConfigDTO>,
  reducers: {
    receive(state, action: PayloadAction<SiteConfigDTO>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const blocks = createSlice({
  name: 'blocks',
  initialState: {} as Record<string, BlockDTO>,
  reducers: {
    receive(state, action: PayloadAction<BlockDTO>) {
      const key = blockIdToString(action.payload.id);
      state[key] = action.payload;
    },
  },
});

export const versions = createSlice({
  name: 'versions',
  initialState: {} as Record<string, ALL_BLOCKS>,
  reducers: {
    receive(state, action: PayloadAction<ALL_BLOCKS>) {
      const key = versionIdToString(action.payload.id);
      state[key] = action.payload;
    },
  },
});

export const drafts = createSlice({
  name: 'drafts',
  initialState: {} as Record<string, DraftDTO>,
  reducers: {
    receive(state, action: PayloadAction<DraftDTO>) {
      const key = draftIdToString(action.payload.id);
      state[key] = action.payload;
    },
  },
});

export const templates = createSlice({
  name: 'templates',
  initialState: {} as Record<string, TemplateSpec & { id: string }>,
  reducers: {
    receive(state, action: PayloadAction<TemplateSpec & { id: string }>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const apiReducer = combineReducers({
  users: users.reducer,
  teams: teams.reducer,
  projects: projects.reducer,
  siteconfigs: siteconfigs.reducer,
  blocks: blocks.reducer,
  versions: versions.reducer,
  drafts: drafts.reducer,
  templates: templates.reducer,
});

export type APIState = ReturnType<typeof apiReducer>;

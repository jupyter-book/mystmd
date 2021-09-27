import {
  Project as ProjectDTO,
  Block as BlockDTO,
  blockIdToString,
  ALL_BLOCKS,
  versionIdToString,
} from '@curvenote/blocks';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

export const projects = createSlice({
  name: 'projects',
  initialState: {} as Record<string, ProjectDTO>,
  reducers: {
    recieve(state, action: PayloadAction<ProjectDTO>) {
      state[action.payload.id] = action.payload;
    },
  },
});

export const blocks = createSlice({
  name: 'blocks',
  initialState: {} as Record<string, BlockDTO>,
  reducers: {
    recieve(state, action: PayloadAction<BlockDTO>) {
      const key = blockIdToString(action.payload.id);
      state[key] = action.payload;
    },
  },
});

export const versions = createSlice({
  name: 'versions',
  initialState: {} as Record<string, ALL_BLOCKS>,
  reducers: {
    recieve(state, action: PayloadAction<ALL_BLOCKS>) {
      const key = versionIdToString(action.payload.id);
      state[key] = action.payload;
    },
  },
});

export const rootReducer = combineReducers({
  projects: projects.reducer,
  blocks: blocks.reducer,
  versions: versions.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

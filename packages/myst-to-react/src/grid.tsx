import React from 'react';
import type { NodeRenderer } from './types';

type GridSpec = {
  type: 'grid';
};

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-3 gap-4">{children}</div>;
}

export const GridRenderer: NodeRenderer<GridSpec> = (node, children) => {
  return <Grid key={node.key}>{children}</Grid>;
};

const GRID_RENDERERS = {
  grid: GridRenderer,
};

export default GRID_RENDERERS;

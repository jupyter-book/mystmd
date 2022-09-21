import classNames from 'classnames';
import React from 'react';
import type { NodeRenderer } from './types';

type GridSpec = {
  type: 'grid';
  columns: number[];
};

const gridClassNames = {
  main: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    'grid-cols-5',
    'grid-cols-6',
    'grid-cols-7',
    'grid-cols-8',
    'grid-cols-9',
    'grid-cols-10',
    'grid-cols-11',
    'grid-cols-12',
  ],
  sm: [
    'sm:grid-cols-1',
    'sm:grid-cols-2',
    'sm:grid-cols-3',
    'sm:grid-cols-4',
    'sm:grid-cols-5',
    'sm:grid-cols-6',
    'sm:grid-cols-7',
    'sm:grid-cols-8',
    'sm:grid-cols-9',
    'sm:grid-cols-10',
    'sm:grid-cols-11',
    'sm:grid-cols-12',
  ],
  md: [
    'md:grid-cols-1',
    'md:grid-cols-2',
    'md:grid-cols-3',
    'md:grid-cols-4',
    'md:grid-cols-5',
    'md:grid-cols-6',
    'md:grid-cols-7',
    'md:grid-cols-8',
    'md:grid-cols-9',
    'md:grid-cols-10',
    'md:grid-cols-11',
    'md:grid-cols-12',
  ],
  lg: [
    'lg:grid-cols-1',
    'lg:grid-cols-2',
    'lg:grid-cols-3',
    'lg:grid-cols-4',
    'lg:grid-cols-5',
    'lg:grid-cols-6',
    'lg:grid-cols-7',
    'lg:grid-cols-8',
    'lg:grid-cols-9',
    'lg:grid-cols-10',
    'lg:grid-cols-11',
    'lg:grid-cols-12',
  ],
  xl: [
    'xl:grid-cols-1',
    'xl:grid-cols-2',
    'xl:grid-cols-3',
    'xl:grid-cols-4',
    'xl:grid-cols-5',
    'xl:grid-cols-6',
    'xl:grid-cols-7',
    'xl:grid-cols-8',
    'xl:grid-cols-9',
    'xl:grid-cols-10',
    'xl:grid-cols-11',
    'xl:grid-cols-12',
  ],
};

const DEFAULT_NUM_COLUMNS = 3;

function getColumnClassName(classes: string[], number?: string | number): string {
  const num = Number(number);
  if (!number || Number.isNaN(num)) {
    return getColumnClassName(classes, DEFAULT_NUM_COLUMNS);
  }
  return classes[num - 1] ?? classes[DEFAULT_NUM_COLUMNS];
}

function gridColumnClasses(columns?: number[]): string {
  if (!columns || columns.length <= 1) {
    return getColumnClassName(gridClassNames.main, columns?.[0]);
  }
  if (columns.length !== 4) {
    return getColumnClassName(gridClassNames.main, columns[0]);
  }
  return [
    // getColumnClassName(gridClassNames.main, columns[0]),
    getColumnClassName(gridClassNames.sm, columns[0]),
    getColumnClassName(gridClassNames.md, columns[1]),
    getColumnClassName(gridClassNames.lg, columns[2]),
    getColumnClassName(gridClassNames.xl, columns[3]),
  ].join(' ');
}

function Grid({ columns, children }: { columns?: number[]; children: React.ReactNode }) {
  const gridClasses = gridColumnClasses(columns);
  const gutterClasses = 'gap-4';
  return <div className={classNames('grid', gridClasses, gutterClasses)}>{children}</div>;
}

export const GridRenderer: NodeRenderer<GridSpec> = (node, children) => {
  return (
    <Grid key={node.key} columns={node.columns}>
      {children}
    </Grid>
  );
};

const GRID_RENDERERS = {
  grid: GridRenderer,
};

export default GRID_RENDERERS;

import React from 'react';

export type NodeRenderer<T = any> = (
  node: T & { type: string; key: string },
  children?: React.ReactNode,
) => React.ReactNode;

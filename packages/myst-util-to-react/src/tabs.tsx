import { useIsTabOpen, useTabSet } from '@curvenote/ui-providers';
import classNames from 'classnames';
import type { GenericNode } from 'mystjs';
import { useEffect } from 'react';
import { selectAll } from 'unist-util-select';
import { NodeRenderer } from './types';

interface TabItem extends GenericNode {
  key: string;
  title: string;
  sync?: string;
}

export const TabSetRenderer: NodeRenderer = (node, children) => {
  const items = selectAll('tabItem', node) as TabItem[];
  const keys = items.map((item) => item.sync || item.key);
  const { onClick, active } = useTabSet(keys);
  useEffect(() => {
    onClick(items[0]?.sync || items[0]?.key);
  }, []);
  return (
    <div className="">
      <div className="flex flex-row border-b border-b-gray-100">
        {items.map((item) => {
          const key = item.sync || item.key;
          return (
            <div
              className={classNames('flex-none px-3 py-1 font-semibold cursor-pointer', {
                'text-blue-600 border-b-2 border-b-blue-600': active[key],
                'text-gray-500': !active[key],
              })}
              onClick={() => onClick(key)}
            >
              {item.title}
            </div>
          );
        })}
      </div>
      <div className="shadow flex">
        <div className="w-full px-6">{children}</div>
      </div>
    </div>
  );
};

export const TabItemRenderer: NodeRenderer<TabItem> = (node, children) => {
  const open = useIsTabOpen(node.sync || node.key);
  return <div className={classNames({ hidden: !open })}>{children}</div>;
};

const TAB_RENDERERS: Record<string, NodeRenderer> = {
  tabSet: TabSetRenderer,
  tabItem: TabItemRenderer,
};

export default TAB_RENDERERS;

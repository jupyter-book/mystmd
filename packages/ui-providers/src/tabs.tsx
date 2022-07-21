import React, { createContext, useContext, useState } from 'react';

interface TabState {
  openTabs: string[];
}

type TabContextType = [TabState, (state: TabState) => void];

const TabContext = createContext<TabContextType | undefined>(undefined);

// Create a provider for components to consume and subscribe to changes
export function TabStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ openTabs: [] as string[] });
  return <TabContext.Provider value={[state, setState]}>{children}</TabContext.Provider>;
}

export function useIsTabOpen(key: string): boolean {
  const [state] = useContext(TabContext) ?? [];
  return state?.openTabs.includes(key) ?? false;
}

export function useTabSet(keys: string[]): {
  onClick: (key: string) => void;
  active: Record<string, boolean>;
} {
  const [state, setState] = useContext(TabContext) ?? [];
  const onClick = (tab: string) => {
    const newState = [...(state?.openTabs ?? [])].filter((key) => !keys.includes(key));
    newState.push(tab);
    setState?.({ openTabs: newState });
  };
  const active = Object.fromEntries(
    keys.map((key) => [key, state?.openTabs.includes(key) ?? false]),
  );
  return { onClick, active };
}

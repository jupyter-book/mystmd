import type { SiteDesign } from 'myst-frontmatter';
import React, { createContext, useContext, useEffect, useState } from 'react';
import isEqual from 'lodash.isequal';
import { useMediaQuery } from './hooks';

type UiState = SiteDesign & {
  isNavOpen?: boolean;
};

type UiContextType = [UiState, (state: UiState) => void];

const UiContext = createContext<UiContextType | undefined>(undefined);

// Create a provider for components to consume and subscribe to changes
export function UiStateProvider({ children }: { children: React.ReactNode }) {
  // Close the nav
  const wide = useMediaQuery('(min-width: 1280px)');
  const [state, setState] = useState<UiState>({ isNavOpen: false });
  useEffect(() => {
    if (wide) setState({ ...state, isNavOpen: false });
  }, [wide]);
  return <UiContext.Provider value={[state, setState]}>{children}</UiContext.Provider>;
}

export function useNavOpen(): [boolean, (open: boolean) => void] {
  const [state, setState] = useContext(UiContext) ?? [];
  const setOpen = (open: boolean) => {
    if (open === state?.isNavOpen) return;
    setState?.({ ...state, isNavOpen: open });
  };
  return [state?.isNavOpen ?? false, setOpen];
}

export function useHideDesignElement(key: keyof SiteDesign): [boolean, (hidden?: boolean) => void] {
  const [state, setState] = useContext(UiContext) ?? [];
  const setHidden = (hidden?: boolean) => {
    if (hidden === state?.[key]) return;
    setState?.({ ...state, [key]: hidden });
  };
  return [state?.[key] ?? false, setHidden];
}

export function useUpdateSiteDesign(): [(design?: SiteDesign) => void] {
  const [state, setState] = useContext(UiContext) ?? [];
  const setDesign = (design?: SiteDesign) => {
    if (!design) {
      if (Object.keys(state ?? {}).length <= 1) return;
      setState?.({ isNavOpen: state?.isNavOpen });
      return;
    }
    const next = { isNavOpen: state?.isNavOpen, ...design };
    if (isEqual(next, state)) return;
    setState?.(next);
  };
  return [setDesign];
}

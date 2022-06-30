import { createContext, useContext, useEffect, useState } from 'react';
import { useMediaQuery } from './hooks';

interface UiState {
  isNavOpen: boolean;
}

type UiContextType = [UiState, (state: UiState) => void];

const UiContext = createContext<UiContextType | undefined>(undefined);

// Create a provider for components to consume and subscribe to changes
export function UiStateProvider(props: any) {
  // Close the nav
  const wide = useMediaQuery('(min-width: 1280px)');
  const [state, setState] = useState({ isNavOpen: false });
  useEffect(() => {
    if (wide) setState({ ...state, isNavOpen: false });
  }, [wide]);
  return (
    <UiContext.Provider value={[state, setState] as any}>
      {props.children}
    </UiContext.Provider>
  );
}

export function useNavOpen(): [boolean, (open: boolean) => void] {
  const [state, setState] = useContext(UiContext) ?? [];
  const setOpen = (open: boolean) => {
    if (open === state?.isNavOpen) return;
    setState?.({ ...state, isNavOpen: open });
  };
  return [state?.isNavOpen ?? false, setOpen];
}

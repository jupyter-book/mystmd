import React, { useContext } from 'react';
import type { SiteManifest } from '@curvenote/site-common';

const SiteContext = React.createContext<SiteManifest | undefined>(undefined);

export function SiteProvider({
  config,
  children,
}: {
  config?: SiteManifest;
  children: React.ReactNode;
}) {
  return <SiteContext.Provider value={config}>{children}</SiteContext.Provider>;
}

export function useSiteManifest() {
  const config = useContext(SiteContext);
  return config;
}

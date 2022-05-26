import React, { useContext } from 'react';
import { SiteManifest } from '~/utils';

const ConfigContext = React.createContext<SiteManifest | undefined>(undefined);

export function ConfigProvider({
  config,
  children,
}: {
  config?: SiteManifest;
  children: React.ReactNode;
}) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const config = useContext(ConfigContext);
  return config;
}

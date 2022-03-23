import React, { useContext } from 'react';
import { Config } from '../utils/config.server';

const ConfigContext = React.createContext<Config | null>(null);

export function ConfigProvider({
  config,
  children,
}: {
  config?: Config;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={config ?? null}>{children}</ConfigContext.Provider>
  );
}

export function useConfig() {
  const config = useContext(ConfigContext);
  return config;
}

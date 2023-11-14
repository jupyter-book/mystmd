export type Thebe = {
  lite?: boolean;
  binder?: boolean | BinderHubOptions;
  server?: JupyterServerOptions;
  kernelName?: string;
  sessionName?: string;
  disableSessionSaving?: boolean;
  mathjaxUrl?: string;
  mathjaxConfig?: string;
};

export type WellKnownRepoProviders = 'github' | 'gitlab' | 'git' | 'gist';
export type BinderProviders = WellKnownRepoProviders | string;

export type BinderHubOptions = {
  url?: string;
  ref?: string; // org-name/repo-name for WellKnownRepoProviders, url for 'meca', otherwise any string
  repo?: string;
  provider?: BinderProviders;
};

export type JupyterServerOptions = {
  url?: string;
  token?: string;
};

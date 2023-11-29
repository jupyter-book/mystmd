export type ThebeFrontmatter = boolean | string | ThebeFrontmatterObject;

export type ThebeFrontmatterObject = {
  lite?: boolean;
  binder?: boolean | BinderHubOptions;
  server?: JupyterServerOptions;
  kernelName?: string;
  sessionName?: string;
  disableSessionSaving?: boolean;
  mathjaxUrl?: string;
  mathjaxConfig?: string;
};

// NOTE: currently a subtle difference but will likely grow with lite options
export type ExpandedThebeFrontmatter = Omit<ThebeFrontmatterObject, 'binder'> & {
  binder?: BinderHubOptions;
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

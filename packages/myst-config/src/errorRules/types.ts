export type ErrorRule = {
  id: string;
  severity: 'ignore' | 'warn' | 'error';
  key?: string;
  /** Glob pattern matched against the path of the file where the issue is reported, relative to the folder that contains myst.yml */
  path?: string;
} & Record<string, any>;

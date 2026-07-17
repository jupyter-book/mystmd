export type ErrorRule = {
  id: string;
  severity: 'ignore' | 'warn' | 'error';
  key?: string;
} & Record<string, any>;

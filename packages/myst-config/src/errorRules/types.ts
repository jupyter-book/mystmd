export type ErrorRule = {
  id: string;
  severity?: 'ignore' | 'warn' | 'error';
} & Record<string, any>;

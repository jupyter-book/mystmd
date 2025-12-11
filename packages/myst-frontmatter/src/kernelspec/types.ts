export type KernelSpec = {
  name: string;
  display_name: string;
  language?: string;
  argv?: string[];
  env?: Record<string, any>;
};

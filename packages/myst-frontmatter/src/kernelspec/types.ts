export type KernelSpec = {
  name?: string;
  language?: string;
  display_name?: string;
  argv?: string[];
  env?: Record<string, any>;
};

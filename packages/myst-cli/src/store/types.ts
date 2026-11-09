import type { VFileMessage } from 'vfile-message';

export type ExternalLinkResult = {
  url: string;
  ok?: boolean;
  skipped?: boolean;
  status?: number;
  statusText?: string;
};

export type WarningKind = 'error' | 'warn' | 'info' | 'debug';

export type BuildWarning = {
  message: string;
  kind: WarningKind;
  note?: string | null;
  url?: string | null;
  position?: VFileMessage['position'];
  ruleId?: string | null;
};

export type ValidatedRawConfig = {
  site?: Record<string, any>;
  project?: Record<string, any>;
  extend?: string[];
};

/** Deep read-only view of store state; the store freezes all state at runtime */
export type Frozen<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { readonly [K in keyof T]: Frozen<T[K]> }
    : T;

/** Inverse of `Frozen`: removes `readonly` at all levels */
export type Mutable<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { -readonly [K in keyof T]: Mutable<T[K]> }
    : T;

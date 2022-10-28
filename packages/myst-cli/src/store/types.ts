export type ExternalLinkResult = {
  url: string;
  ok?: boolean;
  skipped?: boolean;
  status?: number;
  statusText?: string;
};

export type WarningKind = 'error' | 'warn' | 'info';

export type BuildWarning = {
  message: string;
  kind: WarningKind;
};

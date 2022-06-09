export enum LaunchpadStatus {
  'launching' = 'launching',
  'cloning' = 'cloning',
  'initializing' = 'initializing',
  'deploying' = 'deploying',
  'completed' = 'completed',
  'failed' = 'failed',
}

export interface LaunchpadDTO {
  id: string;
  source_url: string;
  domain: string;
  status: LaunchpadStatus;
  date_created: Date;
  links: {
    status: string;
  };
}

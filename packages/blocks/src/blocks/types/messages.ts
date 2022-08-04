import { FormatTypes } from './format';

export enum ArtifactStatus {
  'processing' = 'processing',
  'complete' = 'complete',
  'failed' = 'failed',
}

export enum ArtifactProcessingStage {
  launching = 0,
  fetching = 10,
  building = 20,
  saving = 30,
  complete = 40,
}

export type Artifact = {
  id: string;
  format_type: FormatTypes;
  template_id: string;
  options: string;
  status_date: Date;
  status: ArtifactStatus;
  processing_stage: ArtifactProcessingStage;
  template_version?: string;
  path?: string;
  log_path?: string;
  options_path?: string;
};

export interface Message {
  data: string;
  attributes: MessageAttributes;
  [x: string]: any;
}

export interface MessageAttributes {
  job_id: string;
  user: string;
  user_auth: string;
  format: FormatTypes;
  template_id: string;
  options: string;
  project: string;
  block: string;
  version: string;
  template_version?: string;
  path?: string;
  log_path?: string;
  [x: string]: any;
}

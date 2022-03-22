export enum TARGET {
  JupyterMarkdown = 'jupyter.markdown',
  JupyterRaw = 'jupyter.raw',
  JupyterCode = 'jupyter.code',
  JupyterOutput = 'jupyter.output',
}

export type FileMetadata = {
  size: number;
  content_type: string;
  md5: string;
};

export enum XClientName {
  app = 'Curvenote Web Client',
  ext = 'Curvenote Chrome Extension',
  python = 'Curvenote Python Client',
  javascript = 'Curvenote Javascript Client',
}

export const TAG_ABSTRACT = 'abstract';

export enum WellKnownBlockTags {
  abstract = 'abstract',
  appendix = 'appendix',
  acknowledgments = 'acknowledgments',
  chapter = 'chapter',
  dedication = 'dedication',
  preface = 'preface',
  no_export = 'no-export',
}

export const DEFAULT_BLOCK_TAGS = Object.values(WellKnownBlockTags);

export enum ProjectTemplates {
  Blank = 'blank',
  Paper = 'paper',
  Report = 'report',
  Textbook = 'textbook',
  Thesis = 'thesis',
  Tutorial = 'tutorial',
  MeetingNotes = 'meeting_notes',
}

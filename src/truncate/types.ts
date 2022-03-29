export interface INotebookOutput {
  [mimetype: string]: {
    content_type: string;
    content: string;
    path?: string;
  };
}

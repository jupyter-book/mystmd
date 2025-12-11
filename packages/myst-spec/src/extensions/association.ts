// Index information for nodes
export type SubEntryKind = 'entry' | 'see' | 'seealso';
export interface IndexEntry {
  entry: string;
  subEntry?: {
    value: string;
    kind: SubEntryKind;
  };
  emphasis?: boolean;
}

// MyST Extends the association type by adding an HTML ID field and index entries
export interface AssociationExtension {
  html_id?: string;
  // Nodes that may be targetted may also have index entries
  indexEntries?: IndexEntry[];
}

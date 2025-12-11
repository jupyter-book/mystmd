/**
 * Interface for enumerated MyST content
 */
export interface EnumeratedExtension {
  /**
   * Count this enumerated object for numbering based on node type, kind, etc.
   */
  enumerated: boolean;
  /**
   * Resolved enumerated value for this enumerated object.
   */
  enumerator: string;
}

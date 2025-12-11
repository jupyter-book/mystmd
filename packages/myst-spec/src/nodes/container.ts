import type { Literal, Parent, Image, Table, PhrasingContent } from 'mdast';
import type { EnumeratedExtension } from '../extensions/enumerated.js';
import type { FlowContent } from './flow.js';

/**
 * Caption for container content.
 */
export interface Caption extends Parent {
  /**
   * Node type of myst caption.
   */
  type: 'caption';
  children: FlowContent[];
}

export interface CaptionNumber extends Literal, Parent {
  type: 'captionNumber';
  kind: string;
  children: PhrasingContent[];
}

/**
 * Legend for container content.
 */
export interface Legend extends Parent {
  /**
   * Node type of myst legend.
   */
  type: 'legend';
  children: FlowContent[];
}

/**
 * Top-level container node to provide association and numbering to child content.
 */
export interface Container extends Parent, Partial<EnumeratedExtension> {
  /**
   * Node type of myst container.
   */
  type: 'container';
  /**
   * Kind of container contents.
   */
  kind: 'figure' | 'table';
  /**
   * Any custom class information.
   */
  class?: string;
  children: (Caption | Legend | Image | Table)[];
}

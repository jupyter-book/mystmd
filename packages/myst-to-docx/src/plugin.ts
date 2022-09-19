import { Packer } from 'docx';
import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { DocxSerializer } from './serializer';
import type { Options } from './types';
import { createDocFromState } from './utils';

export const plugin: Plugin<[Options], Root, VFile> = function (opts) {
  this.Compiler = (node, file) => {
    const state = new DocxSerializer(file, opts);
    state.renderContent(node);
    const doc = createDocFromState(state);
    if (typeof document === 'undefined') {
      file.result = Packer.toBuffer(doc);
    } else {
      file.result = Packer.toBlob(doc);
    }
    return file;
  };
  return (node: Root) => {
    // Preprocess
    return node;
  };
};

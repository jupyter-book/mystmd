import { Packer } from 'docx';
import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { DocxSerializer } from './serializer.js';
import type { Options } from './types.js';
import { createDocFromState } from './utils.js';

export const plugin: Plugin<[Options], Root, VFile> = function (opts) {
  this.compiler = (node, file) => {
    const state = new DocxSerializer(file, opts);
    state.renderChildren(node as Root);
    const doc = createDocFromState(state);
    if (typeof (globalThis as any).document === 'undefined') {
      file.result = Packer.toBuffer(doc);
    } else {
      file.result = Packer.toBlob(doc);
    }
    return file;
  };
};

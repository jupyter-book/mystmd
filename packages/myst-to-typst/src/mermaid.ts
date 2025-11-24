import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';
import type { Handler } from './types.js';
import { fileError, type GenericNode } from 'myst-common';

function _generateHash(content: string) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

export const mermaidHandler: Handler = (node, state) => {
  console.log("⚙️ Generating mermaid image using mermaid-cli");
  const hash = _generateHash(node.value);
  
  // Use filesPath from options, or fallback to inferring from VFile path
  let filesPath: string;
  if (state.options.filesPath) {
    filesPath = state.options.filesPath;
  } else if (state.file.path) {
    // Fallback: infer from VFile path
    filesPath = path.join(path.dirname(state.file.path), 'files');
  } else {
    // Last resort: use _build/mermaid
    filesPath = path.join(process.cwd(), '_build', 'mermaid');
  }
  
  fs.mkdirSync(filesPath, { recursive: true });
  const outputFile = path.join(filesPath, `mermaid-${hash}.png`);
  const tempFile = path.join(filesPath, `mermaid-${hash}.mmd`);
  
  fs.writeFileSync(tempFile, node.value);
  execSync(`npx @mermaid-js/mermaid-cli -i ${tempFile} -o ${outputFile} -b transparent`);
  
  // Clean up the temporary .mmd file
  fs.unlinkSync(tempFile);
  
  // Use relative path for typst
  const relativePath = `files/mermaid-${hash}.png`;
  state.write(`#image("${relativePath}")\n`);
};
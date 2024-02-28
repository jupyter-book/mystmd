import yaml from 'js-yaml';
import type { TOC } from './types.d.ts';
import schema from "../schemas/schema.json";
import Ajv from "ajv";

export function parseTOC(contents: string): TOC {
  const toc = yaml.load(contents) as any;
  if (Array.isArray(toc)) {
    throw new Error(
      `Encountered a legacy ToC, please see: https://executablebooks.org/en/latest/blog/2021-06-18-update-toc`,
    );
  }

  const ajv = new Ajv.default({logger: console});
  const validate = ajv.compile(schema);
  if (!validate(toc)) {
    const messages: string[] = [];
    for (const error of validate.errors ?? []) {
	    messages.push(`- ${error}`);
    }
    throw new Error(`The given contents do not form a valid TOC. Please see: https://sphinx-external-toc.readthedocs.io/en/latest/user_guide/sphinx.html#basic-structure for information about valid ToC contents`);
    
  }

  return toc as TOC;
}

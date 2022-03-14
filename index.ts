import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { compile } from 'json-schema-to-typescript';

function loadSchema(filename: string) {
  return JSON.parse(readFileSync(filename, 'utf-8'));
}

function flattenRefs(schema: Record<string, any>) {
  // json-schema-to-typescript will put an additional `[k: string]: any` property
  // on every object if additionalProperties is not explicitly `false`.
  // Therefore, we iterate through all the definitions and add this flag everywhere.
  // Doing this on the original json-schema types would be way too strict,
  // but here it works nicely.
  for (const key in schema?.$defs) {
    schema.$defs[key].additionalProperties = false;
    for (const item of schema.$defs[key].allOf || []) {
      item.additionalProperties = false;
    }
  }
  // If we want a typescript type for every myst node type we must move them all
  // to a single json document. Otherwise, json-schema-to-typescript will resolve
  // the references without creating a new type. This simply removes the
  // file references once the schema is already combined into one schema document.
  return JSON.parse(
    JSON.stringify(schema).replace(/"[a-z]+.schema.json#\//g, '"#/')
  );
}

const mystSchema = loadSchema(join(__dirname, 'schema', 'myst.schema.json'));

const subfolders = [
  'unist',
  'commonmark',
  'blocks',
  'roles',
  'directives',
  'footnotes',
];
// Combine all schema files into the single myst schema document
subfolders.forEach(
  (folder) =>
    (mystSchema.$defs = {
      ...mystSchema.$defs,
      ...loadSchema(join(__dirname, 'schema', folder, `${folder}.schema.json`))
        .$defs,
    })
);

async function generate() {
  writeFileSync('index.d.ts', await compile(flattenRefs(mystSchema), 'Root'));
}

generate();

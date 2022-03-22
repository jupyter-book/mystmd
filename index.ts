import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { compile } from 'json-schema-to-typescript';

function loadSchema(filename: string) {
  return JSON.parse(readFileSync(filename, 'utf-8'));
}

function additionalPropsFalse(schema: Record<string, any>) {
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
}

function flattenRefs(schema: Record<string, any>) {
  // If we want a typescript type for every myst node type we must move them all
  // to a single json document. Otherwise, json-schema-to-typescript will resolve
  // the references without creating a new type. This simply removes the
  // file references once the schema is already combined into one schema document.
  return JSON.parse(JSON.stringify(schema).replace(/"[a-z]+.schema.json#\//g, '"#/'));
}

const myst = loadSchema(join(__dirname, 'schema', 'myst.schema.json'));

const subschemas = [
  'unist',
  'abbreviations',
  'admonitions',
  'blocks',
  'comments',
  'commonmark',
  'containers',
  'directives',
  'footnotes',
  'math',
  'references',
  'roles',
  'styles',
  'tables',
];
// Combine all schema files into the single myst schema document
subschemas.forEach(
  (subschema) =>
    (myst.$defs = {
      ...myst.$defs,
      ...loadSchema(join(__dirname, 'schema', `${subschema}.schema.json`)).$defs,
    })
);

async function generate() {
  if (!existsSync('dist')) mkdirSync('dist');
  const schema = flattenRefs(myst);
  writeFileSync(join('dist', 'myst.schema.json'), JSON.stringify(schema, null, 2));
  additionalPropsFalse(schema);
  writeFileSync(join('dist', 'index.d.ts'), await compile(schema, 'Root'));
}

generate();

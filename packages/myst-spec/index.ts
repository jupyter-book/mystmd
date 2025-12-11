import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { compile } from 'json-schema-to-typescript';
import { load, dump } from 'js-yaml';

const outputSchemaFile = 'myst.schema.json';
const outputDocFile = 'myst.schema.md';
const outputTsFile = 'index.d.ts';
const jsonTestCaseFile = 'myst.tests.json';

type PropertyDefinition = {
  description?: string;
  type?: 'string' | 'number' | 'array' | 'object';
  value?: string | string[];
  from?: string;
};

type Properties = Record<string, PropertyDefinition>;

type PropertyInfo = {
  properties: Properties;
  required: string[];
};

type Schema = Record<string, any>;

function loadSchema(filename: string): Schema {
  return JSON.parse(readFileSync(filename, 'utf-8'));
}

/**
 * Mutate schema to make additional properties false everywhere
 *
 * json-schema-to-typescript will put an additional `[k: string]: any` property
 * on every object if additionalProperties is not explicitly `false`.
 * Therefore, we iterate through all the definitions and add this flag everywhere.
 * Doing this on the original json-schema types would be way too strict,
 * but here it works nicely.
 */
function additionalPropsFalse(schema: Schema): void {
  for (const key in schema?.$defs) {
    schema.$defs[key].additionalProperties = false;
    for (const item of schema.$defs[key].allOf || []) {
      item.additionalProperties = false;
    }
  }
}

/**
 * Return new schema where all $refs point to $defs in the current file.
 *
 * This function assumes all $defs are already present in the current file.
 * If we do not have all the $defs in one file, json-schema-to-typescript
 * will resolve the references without creating a new type.
 */
function flattenRefs(schema: Schema): Schema {
  return JSON.parse(JSON.stringify(schema).replace(/"[a-z]+.schema.json#\//g, '"#/'));
}

/**
 * Mutate schema to allow simpler documentation generation functions
 *
 * - Use "allOf" for properties on all object definitions
 * - Move "Root" definition into $defs
 */
function simplifyForDocGeneration(schema: Schema): void {
  for (const key in schema.$defs) {
    if (!schema.$defs[key].allOf && schema.$defs[key].properties) {
      schema.$defs[key].allOf = [
        {
          properties: schema.$defs[key].properties || undefined,
          required: schema.$defs[key].required || undefined,
        },
      ];
    }
  }
  schema.$defs.Root = {
    description: schema.description,
    type: schema.type,
    allOf: schema.allOf,
  };
}

/**
 * Simplifies, for example, #/$defs/Caption -> Caption
 */
function typeFromRef(ref?: string): string {
  return ref ? ref.split('/')[ref.split('/').length - 1] : '';
}

/**
 * Converts, for example, #/$defs/Caption -> {ref}`Caption`
 */
function mdReferenceFromRef(ref?: string): string {
  return `{ref}\`${typeFromRef(ref).toLowerCase()}\``;
}

/**
 * Build simplified property definitions for markdown from JSON schema "properties"
 */
function definitionsFromProps(props: Schema, from?: string): Properties {
  const defs: Properties = {};
  Object.keys(props).forEach((key) => {
    const def: PropertyDefinition = {
      description: props[key].description,
      type: props[key].type,
      from,
    };
    if (props[key].$ref) {
      // "prop": { "$ref": "..."}
      def.type = 'object';
      def.value = mdReferenceFromRef(props[key].$ref);
    } else if (props[key].const) {
      // "prop": {"const": ...}
      // Assumption: const properties are always strings
      def.type = 'string';
      def.value = `"${props[key].const}"`;
    } else if (props[key].type === 'array') {
      def.type = 'array';
      if (props[key].items.type) {
        // "prop": {"type": "array", "items": { "type": "..."}}
        def.value = props[key].items.type;
      } else if (props[key].items.$ref) {
        // "prop": {"type": "array", "items": { "$ref": "..."}}
        def.value = mdReferenceFromRef(props[key].items.$ref);
      } else if (props[key].items.anyOf) {
        // "prop": {"type": "array", "items": {"anyOf": [{ "$ref": "..."}, { "$ref": "..."}]}}
        def.value = props[key].items.anyOf.map((a) => mdReferenceFromRef(a.$ref));
      }
    } else if (props[key].anyOf) {
      if (props[key].anyOf[0].type === 'array') {
        def.type = 'array';
        if (props[key].anyOf[0].items.anyOf) {
          // "prop": {"anyOf": [{"type": "array", "items": "anyOf": [{ "$ref": "..."}, { "$ref": "..."}]}, ...]}
          // In this case, we ignore everything except the first case.
          // In practice, this only occurs with Root nodes, where the first case is
          // the most likely to be used. Other cases are mentioned in the description.
          def.value = props[key].anyOf[0].items.anyOf.map((a) => mdReferenceFromRef(a.$ref));
        } else {
          // "prop": {"anyOf": [{"type": "array", "items": "anyOf": [{ "$ref": "..."}, { "$ref": "..."}]}, ...]}
          def.value = props[key].anyOf.map((a) => mdReferenceFromRef(a.items.$ref));
        }
      } else {
        // "prop": {"anyOf": [{ "$ref": "..."}, { "$ref": "..."}]}
        def.type = 'object';
        def.value = props[key].anyOf.map((a) => mdReferenceFromRef(a.$ref));
      }
    } else if (props[key].enum) {
      // "prop": {"type": "string", "enum": [...]}
      def.value = props[key].enum.map((v) => `"${v}"`);
    }
    defs[key] = def;
  });
  return defs;
}

/**
 * Mutate primary object properties to include secondary properties from a $ref
 *
 * If a property is only defined in the secondary properties, it is added to
 * primary. For properties present in primary and secondary, attributes are
 * treated as follows:
 *
 * property.type & property.value: primary is preferred, and secondary is used if
 * not defined on primary.
 *
 * property.description: only primary is used. If description is not present on
 * primary, it is blank.
 *
 * property.from: secondary is preferred - this means we get the parent where the
 * property is originally defined.
 */
function spliceProperties(primary: Properties, secondary: Properties): void {
  for (const prop in secondary) {
    if (primary[prop]) {
      primary[prop].type = primary[prop].type || secondary[prop].type;
      primary[prop].value = primary[prop].value || secondary[prop].value;
      primary[prop].from = secondary[prop].from || primary[prop].from;
    } else {
      primary[prop] = secondary[prop];
    }
  }
}

/**
 * Extract property information from object definition
 */
function propsFromObject(schemaDefinitions: Schema, key: string, from?: string): PropertyInfo {
  let properties: Properties = {};
  let required: string[] = [];
  schemaDefinitions[key].allOf.forEach((subschema) => {
    // By using simplifyForDocGeneration we ensure all objects have allOf key
    if (subschema.required) {
      required = required.concat(...subschema.required);
    }
    if (subschema.properties) {
      // Properties defined directly on the object
      spliceProperties(properties, definitionsFromProps(subschema.properties, from));
    } else if (subschema.$ref) {
      // Properties defined on referenced definitions
      const key = typeFromRef(subschema.$ref);
      const refProps = propsFromObject(schemaDefinitions, key, key);
      required = required.concat(...refProps.required);
      spliceProperties(properties, refProps.properties);
    }
  });
  return { properties, required };
}

function schemaKey2md(schema: Schema, key: string): string {
  let md = '';
  if (schema.$defs[key].description) {
    md += `${schema.$defs[key].description.replace(/`/g, '\\`')}\n\n`;
  }
  if (schema.$defs[key].allOf) {
    const { properties, required } = propsFromObject(schema.$defs, key);
    for (const prop in properties) {
      const { type, value, description, from } = properties[prop];
      const optionalDoc = required.includes(prop) ? '' : '_optional_';
      const propDoc = type ? `__${prop}__` : '';
      const typeDoc = type ? `_${type}_` : '';
      const descriptionDoc = description?.replace(/\n/g, '\n   ') || undefined;
      const referenceDoc = from ? `See also ${mdReferenceFromRef(from)}` : undefined;
      const valueDoc = value
        ? `(${typeof value === 'object' ? value.join(' | ') : `${value}`})`
        : '';
      const afterProp = [typeDoc, optionalDoc, valueDoc].filter((d) => !!d).join(', ');
      const backup =
        !descriptionDoc && !referenceDoc ? 'No description for this property.' : undefined;
      const definitionDetails = [descriptionDoc, referenceDoc, backup]
        .filter((d) => d != null)
        .join('\n: ');
      md += `${propDoc}: ${afterProp}\n: ${definitionDetails}\n\n`;
    }
  } else if (schema.$defs[key].anyOf) {
    if (schema.$defs[key].anyOf.length > 1) {
      md += 'Any of ';
    } else {
      md += 'Only ';
    }
    md += schema.$defs[key].anyOf.map((a) => mdReferenceFromRef(a.$ref)).join(' | ');
    md += '\n';
  }
  return md;
}

/**
 * Convert myst-spec JSON schema file to markdown string
 *
 * Each object definition in $defs is written out as follows:
 *
 * # Name
 *
 * Object description
 *
 * - __property*__: _type_ ("value") Property description, astrisk
 *   indicates property is required - See [Parent]()
 * - ...
 */
function schema2md(schema: Schema): string {
  let md = '# Node Type Index\n\n';
  Object.keys(schema.$defs).forEach((key) => {
    md += `(${key.toLowerCase()})=\n## ${key}\n\n`;
    md += schemaKey2md(schema, key);
    md += '\n';
  });
  return md;
}

/**
 * Generate files:
 *
 * - dist/myst.schema.json - JSON schema for MyST root and all dependent object
 *   types, consolidated into a single file
 * - dist/index.d.ts - typescript types for all myst-schema objects
 * - docs/myst.schema.md - markdown documentation of all myst-schema objects
 * - docs/nodes/*.md - markdown schema snippets for each node type
 * - dist/examples/*.yml - example files distributed for external testing
 */
async function generate(myst: Schema) {
  if (!existsSync('dist')) mkdirSync('dist');
  if (!existsSync(join('dist', 'examples'))) mkdirSync(join('dist', 'examples'));
  if (!existsSync('docs')) mkdirSync('docs');
  if (!existsSync(join('docs', 'nodes'))) mkdirSync(join('docs', 'nodes'));
  let schema = flattenRefs(myst);
  writeFileSync(join('dist', outputSchemaFile), JSON.stringify(schema, null, 2));
  simplifyForDocGeneration(schema);
  writeFileSync(join('docs', outputDocFile), schema2md(schema));
  Object.keys(schema.$defs).forEach((key) => {
    writeFileSync(join('docs', 'nodes', `${key.toLowerCase()}.md`), schemaKey2md(schema, key));
  });
  schema = flattenRefs(myst);
  additionalPropsFalse(schema);
  writeFileSync(join('dist', outputTsFile), await compile(schema, 'Root'));
  readdirSync(join('docs', 'examples'))
    .filter((name) => name.endsWith('.yml'))
    .forEach((name) =>
      copyFileSync(join('docs', 'examples', name), join('dist', 'examples', name)),
    );
}

const myst = loadSchema(join(__dirname, 'schema', 'myst.schema.json'));
const subschemas = [
  'blocks',
  'roles',
  'directives',
  'references',
  'abbreviations',
  'admonitions',
  'containers',
  'footnotes',
  'math',
  'tables',
  'styles',
  'comments',
  'commonmark',
  'unist',
];
// Combine all schema files into the single myst schema document
subschemas.forEach(
  (subschema) =>
    (myst.$defs = {
      ...myst.$defs,
      ...loadSchema(join(__dirname, 'schema', `${subschema}.schema.json`)).$defs,
    }),
);
generate(myst);

type TestFile = {
  cases: TestCase[];
};
type TestCase = {
  title: string;
  id?: string;
  description?: string;
  skip?: boolean;
  invalid?: boolean;
  mdast: Record<string, any>;
  myst?: string;
  html?: string;
};

type JsonTestCase = {
  title: string;
  mdast: Record<string, any>;
  myst: string;
  html?: string;
};

const directory = join('docs', 'examples');
const files: string[] = readdirSync(directory).filter((name) => name.endsWith('.yml'));
let jsonTestCases: JsonTestCase[] = [];
files.forEach((file) => {
  const testYaml = readFileSync(join(directory, file)).toString();
  const cases = load(testYaml) as TestFile;
  cases.cases.forEach((testCase) => {
    if (!testCase.invalid && !testCase.skip && testCase.mdast && testCase.myst) {
      let html = testCase.html;
      if (html && !html.endsWith('\n')) {
        html = html.concat('\n');
      }
      jsonTestCases = jsonTestCases.concat({
        title: `${file.replace('.yml', '')}: ${testCase.title}`,
        mdast: testCase.mdast,
        myst: testCase.myst,
        html,
      });
    }
    if (testCase.id) {
      const outFile = join(directory, `${testCase.id}.md`);
      let md = '';
      md += '``````{tab-set}\n';
      md += '`````{tab-item} Markup\n:sync: myst\n';
      if (testCase.myst) {
        md += `\`\`\`\`\n${testCase.myst}\n\`\`\`\`\n`;
      } else {
        md += 'No MyST included in example.\n';
      }
      md += '`````\n\n';
      md += '````{tab-item} AST\n:sync: ast\n';
      if (testCase.mdast) {
        md += `\`\`\`yaml\n${dump(testCase.mdast)}\n\`\`\`\n`;
      } else {
        md += 'No AST included in example.\n';
      }
      md += '````\n\n';
      md += '````{tab-item} Render\n:sync: render\n\n';
      if (testCase.myst) {
        md += `${testCase.myst}\n\n`;
      } else {
        md += 'No renderer included in example.\n';
      }
      md += '````\n\n';
      md += '``````\n\n';
      writeFileSync(outFile, md);
    }
  });
});
writeFileSync(join('dist', jsonTestCaseFile), JSON.stringify(jsonTestCases, null, 2));

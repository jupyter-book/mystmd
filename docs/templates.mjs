/**
 * Example of a MyST plugin that retrieves MyST template option information
 * and displays it as a definition list
 */
import { u } from 'unist-builder';
import { mystParse } from 'myst-parser';

/**
 * @typedef MySTTemplateRef
 * @type {object}
 * @property {string} template - a partial or fully resolved template name
 * @property {string} kind - the kind of template, e.g. 'site'
 * @property {boolean} fullTitle - show the full template title, or just the name
 * @property {number} headingDepth - depth of the generated heading (e.g. 1 for h1)
 */

/**
 * Create a documentation section for a template
 *
 * This directive simply passes-through the options into an AST node,
 * because we can't (shouldn't) perform any async / blocking work here.
 *
 * @type {import('myst-common').DirectiveSpec}
 */
const mystTemplate = {
  name: 'myst:template',
  options: {
    kind: {
      type: String,
    },
    'full-title': {
      type: Boolean,
    },
    'heading-depth': {
      type: Number,
    },
  },
  arg: {
    type: String,
    required: true,
  },
  run(data) {
    /** @type {MySTTemplateRef} */
    const templateRef = u(
      'myst-template-ref',
      {
        template: data.arg,
        kind: data.options?.kind ?? 'site',
        fullTitle: data.options?.['fullTitle'] ?? false,
        headingDepth: data.options?.['heading-depth'] ?? 2,
      },
      [],
    );
    return [templateRef];
  },
};

let _promise = undefined;

/**
 * Determine a URL-friendly slug for a given template ID.
 *
 * @param id - template ID
 */
function slugify(id) {
  return id.replaceAll('/', '-');
}

/**
 * Return the MyST AST for a given template option declaration.
 *
 * @param template - template declaration
 * @param option - option declaration
 */
function createOption(template, option) {
  if (!option) {
    return [];
  }

  // Build a definitionTerm for the given template option
  const def = [
    u('definitionTerm', { identifier: `template-${slugify(template.id)}-${slugify(option.id)}` }, [
      u('strong', [u('text', option.id)]),
      ...(option.type
        ? [
            u('text', ' ('),
            u('emphasis', [u('text', `${option.type}${option.required ? ', required' : ''}`)]),
            u('text', ')'),
          ]
        : []),
    ]),
  ];

  // Build a definitionDescription for the given template option, falling back on default text if
  // no description is defined.
  def.push(
    u(
      'definitionDescription',
      // Parse the description as MyST (if given)
      option.description ? mystParse(option.description).children : [u('text', 'No description')],
    ),
  );
  return def;
}

/**
 * Load a MyST Template e.g. https://api.mystmd.org/templates/site/myst/book-theme
 *
 * @param url - url to MyST template
 */
async function loadFromTemplateMeta(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Load a list of MyST templates with a given kind, e.g. https://api.mystmd.org/templates/site/
 *
 * @param url - url to MyST templates
 */
async function loadByTemplateKind(url) {
  const response = await fetch(url);
  const { items } = await response.json();
  return await Promise.all(items.map((item) => loadFromTemplateMeta(item.links.self)));
}

/**
 * Load a list of all MyST templates given by api.mystmd.org
 */
async function loadTemplates() {
  // Load top-level list of templates
  const response = await fetch(`https://api.mystmd.org/templates/`);
  const { links } = await response.json();
  // Load all the top-level kinds
  return (await Promise.all(Object.values(links).map(loadByTemplateKind))).flat();
}

// Define some regular expressions to identify partial template names (e.g. book-theme)
// vs full names (e.g. site/myst/book-theme)
const PARTIAL_TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
const FULL_TEMPLATE_REGEX = /^(site|tex|typst|docx)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;

/**
 * MyST transform to fetch information about MyST templates from api.mystmd.org, and
 * populate the children of myst-template-ref nodes using this data
 *
 * @param opts - (empty) options populated by the caller (MyST)
 * @param utils - helpful utility functions
 */
function templateTransform(opts, utils) {
  return async (mdast) => {
    // This function is called during processing of all documents, with multiple invocations
    // potentially running concurrently. To avoid fetching the templates for each call,
    // we first create the promise (but _do not await it_) so that other invocations
    // can await the result.
    if (_promise === undefined) {
      _promise = loadTemplates();
    }

    // Now we await the list of templates. After this promise has been resolved, this will
    // happen instantly
    let templates;
    try {
      templates = await _promise;
    } catch (err) {
      throw new Error('Error loading template information from https://api.mystmd.org');
    }

    // Using unist-util-select, a utility for walking unist (to which MyST confirms) graphs.
    // We are looking for nodes of type `myst-template-ref`, which are created by our directive above
    utils.selectAll('myst-template-ref', mdast).forEach((node) => {
      // Figure out whether the caller gave a full template or partial template name.
      // If the name is partial, we will try to resolve it into a full name.
      const templateName = node.template;
      let resolvedTemplateName;
      if (templateName.match(PARTIAL_TEMPLATE_REGEX) && node.kind !== undefined) {
        resolvedTemplateName = `${node.kind}/myst/${templateName}`;
      } else if (templateName.match(TEMPLATE_REGEX) && node.kind !== undefined) {
        resolvedTemplateName = `${node.kind}/${templateName}`;
      } else if (templateName.match(FULL_TEMPLATE_REGEX)) {
        resolvedTemplateName = templateName;
      } else {
        throw new Error(`Could not determine full name for template: ${templateName}`);
      }

      // Let's now find the template information for the requested template name
      const template = templates.find((template) => template.id === resolvedTemplateName);
      if (template === undefined) {
        throw new Error(`Could not find template ${templateName}`);
      }

      // Parse the template name into useful parts
      const [_, kind, namespace, name, ...rest] = template.id.match(FULL_TEMPLATE_REGEX);

      // Build the title node
      const title = node.fullTitle ? template.id : name;
      const slug = slugify(template.id);
      const heading = u('heading', { depth: node.headingDepth, identifier: `template-${slug}` }, [
        u('inlineCode', title),
        u('text', ' template'),
      ]);

      // Parse the template description
      const doc = template.description ? mystParse(template.description).children : [];

      // Build a definitionList of template options
      const options = (template.options ?? {})
        .map((option) => createOption(template, option))
        .flat();
      const list = u('definitionList', [
        u('definitionTerm', { identifier: `template-${slug}-opts` }, [
          u('strong', [u('text', 'Options')]),
        ]),
        options.length > 0
          ? u('definitionDescription', [u('definitionList', options)])
          : u('definitionDescription', [u('text', 'No options')]),
      ]);

      // Add a footer that links to the template source
      const link = {
        type: 'link',
        url: template.links.source,
        children: [
          {
            type: 'text',
            value: 'Source',
          },
        ],
      };

      // Update the `myst-template-ref` children with our generated nodes
      node.children = [heading, ...doc, list, link];
    });
  };
}

// Declare a transform plugin
const mystTemplateTransform = {
  plugin: templateTransform,
  stage: 'document',
};

/**
 * @type {import('myst-common').MystPlugin}
 */
const plugin = {
  name: 'MyST Template Documentation Plugins',
  author: 'Angus Hollands',
  license: 'MIT',
  directives: [mystTemplate],
  roles: [],
  transforms: [mystTemplateTransform],
};

export default plugin;

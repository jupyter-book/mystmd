import { u } from 'unist-builder';
import { mystParse } from 'myst-parser';

/**
 * Create a documentation section for a directive
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
  run(data, vfile) {
    return [
      u(
        'myst-template-ref',
        {
          template: data.arg,
          kind: data.options?.kind ?? 'site',
          fullTitle: data.options?.['fullTitle'] ?? false,
          headingDepth: data.options?.['heading-depth'] ?? 2,
        },
        [],
      ),
    ];
  },
};

let _promise = undefined;


function slugify(id) {
  return id.replaceAll('/', '-');
}

function createOption(template, option) {
  if (!option) return [];
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

  if (option.description) {
    def.push(
      u(
        'definitionDescription',
        option.description ? mystParse(option.description).children : [u('text', 'No description')],
      ),
    );
  }
  return def;
}

async function loadFromTemplateMeta(url) {
  const response = await fetch(url);
  return await response.json();
}

async function loadByTemplateKind(url) {
  const response = await fetch(url);
  const { items } = await response.json();
  return await Promise.all(items.map((item) => loadFromTemplateMeta(item.links.self)));
}

async function loadTemplates() {
  // Load top-level list of templates
  const response = await fetch(`https://api.mystmd.org/templates/`);
  const { links } = await response.json();
  // Load all the top-level kinds
  return (await Promise.all(Object.values(links).map(loadByTemplateKind))).flat();
}

const PARTIAL_TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+$/;
const TEMPLATE_REGEX = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/;
const FULL_TEMPLATE_REGEX = /^(site|tex|typst|docx)\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/;

function templateTransform(opts, utils) {
  return async (mdast) => {
    if (_promise === undefined) {
      _promise = loadTemplates();
    }

    let templates;
    try {
      templates = await _promise;
    } catch (err) {
      throw new Error('Error loading template information from https://api.mystmd.org');
    }

    utils.selectAll('myst-template-ref', mdast).forEach((node) => {
      const templateName = node.template;
      let resolvedTemplateName;
      if (templateName.match(PARTIAL_TEMPLATE_REGEX) && node.kind !== undefined) {
        resolvedTemplateName = `${node.kind}/myst/${templateName}`;
      } else if (templateName.match(TEMPLATE_REGEX) && node.kind !== undefined) {
        resolvedTemplateName = `${node.kind}/${templateName}`;
      } else if (templateName.match(FULL_TEMPLATE_REGEX)) {
        resolvedTemplateName = templateName;
      } else {
        throw new Error(`Could not find template with name ${templateName}`);
      }

      // Match the name
      const template = templates.find((template) => template.id === resolvedTemplateName);
      const slug = slugify(template.id);

      const [_, kind, namespace, name, ...rest] = template.id.match(FULL_TEMPLATE_REGEX);
      const title = node.fullTitle ? template.id : name;
      const heading = u('heading', { depth: node.headingDepth, identifier: `template-${slug}` }, [
        u('inlineCode', title),
        u('text', ' template'),
      ]);

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
      const doc = template.description ? mystParse(template.description).children : [];
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
      node.children = [heading, ...doc, list, link];
    });
  };
}

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

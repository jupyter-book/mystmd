import type { JSONSchema7Definition } from 'json-schema';

const LicenseSchema: JSONSchema7Definition = {
  $id: '',
  description:
    'The license information, which can be either a string or an object with `code` and `content`.',
  default: 'CC-BY-4.0',
  examples: ['CC-BY-4.0', { code: 'MIT', content: 'CC-BY-4.0' }],
  oneOf: [
    {
      type: 'string',
      description: 'The license specified as a simple string.',
    },
    {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The license code, such as MIT, GPL, etc.',
          default: 'MIT',
        },
        content: {
          type: 'string',
          description: 'Detailed content or description of the license.',
          default: 'CC-BY-4.0',
        },
      },
      required: ['code', 'content'],
      additionalProperties: false,
    },
  ],
};

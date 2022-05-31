import { basicLogger, LogLevel } from '../logging';
import { validateProjectConfig } from './validators';

const opts = { logger: basicLogger(LogLevel.info), property: 'test' };

describe('validateProjectConfig', () => {
  it('empty object returns self', async () => {
    expect(validateProjectConfig({}, opts)).toEqual({});
  });
  it('valid project config returns self', async () => {
    const projConfig = {
      title: 'example',
      remote: 'https://curvenote.com/@test/project',
      index: 'folder/readme.md',
      exclude: ['license.md'],
    };
    expect(validateProjectConfig(projConfig, opts)).toEqual(projConfig);
  });
  it('invalid remote url errors', async () => {
    expect(() => validateProjectConfig({ remote: 'https://example.com' }, opts)).toThrow();
  });
});

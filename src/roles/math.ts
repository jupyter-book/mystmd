import { RoleConstructor } from './types';
import { toHTML } from '../utils';

const roles = {
  math: {
    token: 'math_inline',
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      const [html] = toHTML(['span', { class: 'math', children: token.content }], { inline: true });
      return html;
    },
  } as RoleConstructor,
};

export default roles;

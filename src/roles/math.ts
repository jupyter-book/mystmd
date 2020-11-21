import { RoleConstructor } from './types';
import { renderMath } from '../math';

const roles = {
  math: {
    token: 'math_inline',
    renderer: (tokens, idx) => renderMath(tokens[idx].content, false),
  } as RoleConstructor,
};

export default roles;

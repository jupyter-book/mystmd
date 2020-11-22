import { Role } from './types';
import { renderMath } from '../math';

const roles = {
  math: {
    token: 'math_inline',
    renderer: (tokens, idx) => renderMath(tokens[idx].content, false),
  } as Role,
};

export default roles;

import html from './html';
import math from './math';
import reference from './references';
import generic from './generic';
import { RoleConstructor } from './types';

const roles: Record<string, RoleConstructor> = {
  ...html,
  ...math,
  ...reference,
  ...generic,
};

export default roles;

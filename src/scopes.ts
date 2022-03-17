import { ROLES } from './roles';

export const NO_SCOPE = undefined;

export enum SCOPES {
  teamCreate = 'team.create',
  teamRead = 'team.read',
  teamUpdate = 'team.update',
  teamAccessRead = 'team.access.read',
  teamAccessWrite = 'team.access.write',
  teamAccessLeave = 'team.access.leave',
  teamAccessDelete = 'team.access.delete',
  projectCreate = 'project.create',
  projectRead = 'project.read',
  projectUpdate = 'project.update',
  projectVisibility = 'project.visibility',
  projectPublish = 'project.publish',
  projectDelete = 'project.delete',
  projectAccessRead = 'project.access.read',
  projectAccessWrite = 'project.access.write',
  blockRead = 'block.read',
  blockWrite = 'block.write',
  blockDelete = 'block.delete',
  commentRead = 'comment.read',
  commentWrite = 'comment.write',
  commentUpdate = 'project.comment.update',
  commentResolve = 'project.comment.resolve',
  commentDelete = 'project.comment.delete',
}

export interface CRUD {
  create: SCOPES;
  read: SCOPES;
  update: SCOPES;
  delete: SCOPES;
}

function readWrite(readScope: SCOPES, writeScope: SCOPES, deleteScope?: SCOPES): CRUD {
  return {
    create: writeScope,
    read: readScope,
    update: writeScope,
    delete: deleteScope ?? writeScope,
  };
}

export const scopes = {
  team: {
    create: SCOPES.teamCreate,
    read: SCOPES.teamRead,
    update: SCOPES.teamUpdate,
    access: {
      ...readWrite(SCOPES.teamAccessRead, SCOPES.teamAccessWrite),
      delete: SCOPES.teamAccessDelete,
      leave: SCOPES.teamAccessLeave,
      list: SCOPES.teamAccessRead,
    },
  },
  project: {
    create: SCOPES.projectCreate,
    read: SCOPES.projectRead,
    update: SCOPES.projectUpdate,
    visibility: SCOPES.projectVisibility,
    delete: SCOPES.projectDelete,
    access: {
      ...readWrite(SCOPES.projectAccessRead, SCOPES.projectAccessWrite),
      list: SCOPES.projectAccessRead,
    },
    manifest: {
      read: SCOPES.projectRead,
      create: SCOPES.projectPublish,
      delete: SCOPES.projectPublish,
    },
    publish: SCOPES.projectPublish,
  },
  process: {
    notebook: SCOPES.blockWrite,
    bibtex: SCOPES.blockWrite,
  },
  block: {
    ...readWrite(SCOPES.blockRead, SCOPES.blockWrite, SCOPES.blockDelete),
    list: SCOPES.blockRead,
    version: {
      ...readWrite(SCOPES.blockRead, SCOPES.blockWrite),
      list: SCOPES.blockRead,
    },
    draft: {
      // Drafts require write access
      ...readWrite(SCOPES.blockWrite, SCOPES.blockWrite, SCOPES.blockDelete),
      list: SCOPES.blockWrite,
      steps: {
        ...readWrite(SCOPES.blockWrite, SCOPES.blockWrite),
        list: SCOPES.blockWrite,
      },
    },
    comment: {
      create: SCOPES.commentWrite,
      read: SCOPES.commentRead,
      update: SCOPES.commentUpdate,
      resolve: SCOPES.commentResolve,
      delete: SCOPES.commentDelete,
      list: SCOPES.commentRead,
    },
  },
};

export const scopesInRole: Record<ROLES, SCOPES[]> = {
  [ROLES.teamAdmin]: [
    SCOPES.teamRead,
    SCOPES.teamUpdate,
    SCOPES.teamAccessRead,
    SCOPES.teamAccessLeave,
    SCOPES.teamAccessWrite,
    SCOPES.teamAccessDelete,
    SCOPES.projectCreate,
  ],
  [ROLES.teamMember]: [
    SCOPES.teamRead,
    SCOPES.teamAccessRead,
    SCOPES.teamAccessLeave,
    SCOPES.projectCreate,
  ],
  [ROLES.projectOwner]: [
    SCOPES.projectRead,
    SCOPES.projectUpdate,
    SCOPES.projectVisibility,
    SCOPES.projectDelete,
    SCOPES.projectAccessRead,
    SCOPES.projectAccessWrite,
    SCOPES.projectPublish,
    SCOPES.blockRead,
    SCOPES.blockWrite,
    SCOPES.blockDelete,
    SCOPES.commentRead,
    SCOPES.commentWrite,
    SCOPES.commentUpdate,
    SCOPES.commentResolve,
    SCOPES.commentDelete,
  ],
  [ROLES.projectEditor]: [
    SCOPES.projectRead,
    SCOPES.projectUpdate,
    SCOPES.projectAccessRead,
    SCOPES.projectPublish,
    SCOPES.blockRead,
    SCOPES.blockWrite,
    SCOPES.commentRead,
    SCOPES.commentWrite,
    SCOPES.commentResolve,
  ],
  [ROLES.projectComment]: [
    SCOPES.projectRead,
    SCOPES.blockRead,
    SCOPES.commentRead,
    SCOPES.commentWrite,
  ],
  [ROLES.projectView]: [SCOPES.projectRead, SCOPES.blockRead, SCOPES.commentRead],
  [ROLES.manifest]: [SCOPES.projectRead],
  [ROLES.public]: [SCOPES.teamRead, SCOPES.projectRead, SCOPES.blockRead],
};

function getScopes(role: ROLES): SCOPES[] {
  if (role in scopesInRole) {
    return scopesInRole[role];
  }
  // eslint-disable-next-line no-console
  console.log('Role not found: ', role);
  return [];
}

export function hasScope(role: ROLES, scope: SCOPES): boolean {
  const roleScopes = getScopes(role);
  return roleScopes.indexOf(scope) !== -1;
}

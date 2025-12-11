export type License = {
  id?: string;
  name?: string;
  url?: string;
  note?: string;
  // These are only allowed if license is from SPDX
  free?: boolean;
  CC?: boolean;
  osi?: boolean;
};

export type Licenses = {
  content?: License;
  code?: License;
};

export type License = {
  name: string;
  url: string;
  id: string;
  free?: boolean;
  CC?: boolean;
  osi?: boolean;
};

export type Licenses = {
  content?: License;
  code?: License;
};

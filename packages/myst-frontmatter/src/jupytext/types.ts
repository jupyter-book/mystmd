export type TextRepresentation = {
  extension?: string;
  format_name?: string;
  format_version?: string;
  jupytext_version?: string;
};

export type Jupytext = {
  formats?: string;
  text_representation?: TextRepresentation;
};

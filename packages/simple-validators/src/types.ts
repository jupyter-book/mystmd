type message = {
  property: string;
  message: string;
};

export type ValidationOptions = {
  property: string;
  messages: { errors?: message[]; warnings?: message[] };
  file?: string;
  location?: string;
  suppressWarnings?: boolean;
  suppressErrors?: boolean;
  // Optional logging functions called on validationWarning/Error
  warningLogFn?: (message: string) => void;
  errorLogFn?: (message: string) => void;
  // escapeFn is only used in string validation
  escapeFn?: (s: string) => string;
};

export type KeyOptions = ValidationOptions & {
  returnInvalidPartial?: boolean;
  keepExtraKeys?: boolean;
};

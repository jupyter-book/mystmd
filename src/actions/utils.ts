import { JSDOM } from 'jsdom';
import { server, schemas } from '@curvenote/schema';

export function getEditorState(content: string, schema: schemas.UseSchema = 'full') {
  const { document, DOMParser } = new JSDOM('').window;
  const state = server.getEditorState(schema, content, 0, document, DOMParser);
  return state;
}

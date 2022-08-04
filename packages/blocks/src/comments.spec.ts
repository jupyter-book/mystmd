import moment from 'moment';
import { commentFromDTO, CommentId } from './comments';

describe('Comment Blocks', () => {
  let some_comment_id: CommentId;

  beforeEach(() => {
    some_comment_id = {
      project: 'a',
      block: 'b',
      comment: 'text',
    };
  });

  describe('from json', () => {
    it('given empty json, populates with defaults', () => {
      const { id, created_by, content, resolved, edited, date_created, date_modified, links } =
        commentFromDTO(some_comment_id, {});

      expect(id).toEqual(some_comment_id);
      expect(created_by).toBeEmpty();
      expect(content).toBeEmpty();
      expect(resolved).toBeFalse();
      expect(edited).toBeFalse();
      expect(date_created).toBeValidDate();
      expect(date_modified).toBeValidDate();
      expect(links).toBeEmpty();
    });

    it('given a json object, should be populated with values', () => {
      const jsonComment = {
        created_by: 'user1',
        content: 'hello world!',
        resolved: true,
        edited: true,
        date_created: '2019-10-15T12:09:01.000Z',
        date_modified: '2019-10-25T12:10:01.000Z',
        links: {
          self: 'some/valid/uri',
          block: 'some/valid/block/uri',
        },
      };

      const { id, created_by, content, resolved, edited, date_created, date_modified, links } =
        commentFromDTO(some_comment_id, jsonComment);

      expect(id).toEqual(some_comment_id);
      expect(created_by).toBe(jsonComment.created_by);
      expect(content).toBe(jsonComment.content);
      expect(resolved).toBe(jsonComment.resolved);
      expect(edited).toBe(jsonComment.edited);
      expect(date_created).toBeValidDate();
      expect(date_created).toEqual(moment.utc('2019-10-15 12:09:01').toDate());
      expect(date_modified).toBeValidDate();
      expect(date_modified).toEqual(moment.utc('2019-10-25 12:10:01').toDate());
      expect(links).toContainKeys(['self', 'block']);
    });
  });

  describe('to json', () => {
    it('given empty object, populates with defaults', () => {
      const minimalComment = {
        id: { ...some_comment_id },
        date_created: moment.utc('2019-10-15 12:09:01').toDate(),
        date_modified: moment.utc('2019-10-25 12:10:01').toDate(),
      };

      const jsonObject = commentFromDTO(some_comment_id, minimalComment);

      expect(jsonObject.id).toEqual(some_comment_id);
      expect(jsonObject.created_by).toBeEmpty();
      expect(jsonObject.content).toBeEmpty();
      expect(jsonObject.resolved).toBeFalse();
      expect(jsonObject.edited).toBeFalse();
      expect(jsonObject.date_created).toBeValidDate();
      expect(jsonObject.date_modified).toBeValidDate();
      expect(jsonObject.links).toBeEmpty();
    });
  });
});

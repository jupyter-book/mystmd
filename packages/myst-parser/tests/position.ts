export const position = {
  end: {
    column: 0,
    line: 1,
  },
  start: {
    column: 0,
    line: 0,
  },
};

export const positionFn = (start: number, end: number) => {
  return {
    end: {
      column: 0,
      line: end,
    },
    start: {
      column: 0,
      line: start,
    },
  };
};

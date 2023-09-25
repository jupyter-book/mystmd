export const position = {
  end: {
    column: 1,
    line: 1,
  },
  start: {
    column: 1,
    line: 1,
  },
};

export const positionFn = (
  start: number,
  end: number,
  colStart: number = 1,
  colEnd: number = 1,
) => {
  return {
    end: {
      column: colEnd,
      line: end,
    },
    start: {
      column: colStart,
      line: start,
    },
  };
};

/**
 * A barrier synchronization primitive that blocks until a fixed number clients are waiting
 *
 * @param nClients - number of clients that must wait before unblocking
 */
export function makeBarrier(nClients: number): {
  promise: Promise<void>;
  wait: () => Promise<number>;
} {
  const ctx: { resolve?: () => void | undefined } = {};
  const promise = new Promise<void>((resolve) => {
    ctx.resolve = resolve;
  });

  let nWaiting = nClients;
  const wait = async () => {
    nWaiting--;
    if (!nWaiting) {
      ctx.resolve!();
    }
    await promise;
    return nWaiting;
  };
  return { promise, wait };
}

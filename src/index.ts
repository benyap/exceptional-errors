/**
 * Work in progress.
 */
export class EError extends Error {
  constructor(...args: Parameters<typeof Error>) {
    super(...args);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BaseError extends Error {
  constructor(params) {
    super(params.message);

    this.name = new.target.name;
    this.code = params.code;
    this.metadata = params.metadata ?? {};
    this.cause = params.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

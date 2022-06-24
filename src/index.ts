// --- cause ---

export function cause<T extends EError>(
  error: T
): NonNullable<T["cause"]> | null;

export function cause(error: Error): Error | null;

export function cause(error: Error) {
  if ("cause" in error) {
    const cause = (error as any).cause;
    if (cause instanceof Error) return cause;
    return null;
  }
  return null;
}

// --- info ---

export function info<T extends EError>(error: T): NonNullable<T["info"]> | null;

export function info(error: Error): unknown;

export function info(error: Error) {
  if ("info" in error) {
    return (error as any).info ?? null;
  }
  return null;
}

// --- findCause ---

export function findCause(error: Error, ...names: string[]): Error | null {
  const causeNames = new Set(names);

  let errorCause: Error | null = cause(error);
  while (errorCause) {
    if (causeNames.has(errorCause.name)) return errorCause;
    errorCause = cause(errorCause);
  }

  return null;
}

export function findCauses(error: Error, ...names: string[]): Error[] {
  const causeNames = new Set(names);
  const causes: Error[] = [];

  let errorCause: Error | null = cause(error);
  while (errorCause) {
    if (causeNames.has(errorCause.name)) causes.push(errorCause);
    errorCause = cause(errorCause);
  }

  return causes;
}

// --- hasCause ---

export function hasCause(error: Error, ...names: string[]): boolean {
  return findCause(error, ...names) !== null;
}

// --- fullStack ---

const EMPTY_STACK_TRACE = "<stack trace empty>";

export function fullStack(error: Error): string {
  const causeError = cause(error);
  if (causeError)
    return (
      (error.stack ?? EMPTY_STACK_TRACE) +
      "\n\n" +
      `caused by: ${fullStack(causeError)}`
    );
  return error.stack ?? EMPTY_STACK_TRACE;
}

// --- toJSON ---

export type EErrorJSON = {
  name: string;
  message: string;
  summary?: string;
  info?: any;
  cause?: EErrorJSON;
  stack?: string[];
};

export function toJSON(
  error: Error,
  options: { stack?: boolean } = {}
): EErrorJSON {
  const json: EErrorJSON = {
    name: error.name,
    message: error.message,
  };

  if (error instanceof EError && error.summary) {
    json.summary = error.summary;
  }

  const errorCause = cause(error);
  if (errorCause) {
    json.cause = toJSON(errorCause, options);
  }

  const errorInfo = info(error);
  if (errorInfo) {
    json.info = errorInfo;
  }

  if (options.stack) {
    const stack = error.stack;
    if (stack) json.stack = stack.split("\n");
  }

  return json;
}

// --- EError ---

export type Info = { [key: string]: any };

export class EError<
  T extends Info = Info,
  Cause extends Error = Error
> extends Error {
  static readonly cause = cause;
  static readonly info = info;
  static readonly fullStack = fullStack;
  static readonly toJSON = toJSON;

  readonly summary?: string;
  readonly info?: Omit<T, "cause" | "private">;
  readonly cause?: Cause;
  readonly private?: boolean;

  constructor(message: string);

  constructor(message: string, error: Cause);

  constructor(message: string, error: Cause, info: T & { private?: boolean });

  constructor(
    message: string,
    options: T & { cause?: Cause; private?: boolean }
  );

  constructor(
    message: string,
    causeOrOptions?: Cause | (T & { cause?: Cause; private?: boolean }),
    info?: T & { private?: boolean }
  ) {
    let _cause: Cause | undefined = undefined;
    let _private: boolean | undefined = undefined;
    let _info: Omit<T, "cause" | "private"> | undefined = undefined;

    // Normalise arguments
    if (causeOrOptions instanceof Error) {
      _cause = causeOrOptions;
      if (info) {
        const { cause, private: isPrivate, ...rest } = info;
        _private = isPrivate;
        _info = rest;
      }
    } else if (causeOrOptions) {
      const { cause, private: isPrivate, ...rest } = causeOrOptions;
      _cause = cause;
      _private = isPrivate;
      _info = rest;
    }

    if (_private || !_cause) {
      super(message);
    } else {
      super(`${message}: ${_cause.message}`);
      this.summary = message;
    }

    if (_private) this.private = true;
    if (_cause) this.cause = _cause;
    if (_info && Object.keys(_info).length > 0) this.info = _info;

    // Provides compatibility with instanceof
    Object.setPrototypeOf(this, new.target.prototype);

    // Set the correct constructor name
    this.name = new.target.name;

    // Maintains proper stack trace for where the error is thrown (only works in V8)
    (Error as any).captureStackTrace?.(this, new.target);
  }

  findCause(...names: string[]) {
    return findCause(this, ...names);
  }

  findCauses(...names: string[]) {
    return findCauses(this, ...names);
  }

  hasCause(...names: string[]) {
    return hasCause(this, ...names);
  }

  fullStack() {
    return fullStack(this);
  }

  toJSON(options: { stack?: boolean } = {}) {
    return toJSON(this, options);
  }
}

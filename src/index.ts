/**
 * Token to use when an error has an empty stack trace.
 */
const EMPTY_STACK_TRACE = "<stack trace empty>";

/**
 * Normalised JSON format for errors.
 */
export type EErrorJSON = {
  name: string;
  message: string;
  summary?: string;
  info?: any;
  cause?: EErrorJSON;
  stack?: string[];
};

/**
 * Arbitrary data to pass to an {@link EError} object.
 */
export type Info = { [key: string]: any };

/**
 * An extension of the built-in {@link Error} class that allows you to wrap an
 * existing error as the cause and add structured data to help with debugging.
 *
 * @template T The shape of any structured data to pass to the error, which can be accessed through the `.info` property. Defaults to the arbitrary type {@link Info}.
 * @template Cause The error type that this error may wrap as a cause, which can be accessed through the `.cause` property. Defaults to the built-in type {@link Error}.
 */
export class EError<
  T extends Info = Info,
  Cause extends Error = Error
> extends Error {
  /**
   * Provides a short version of the error message without
   * the cause chain if the error is not {@link private}.
   */
  readonly summary?: string;

  /**
   * Indicates that the error's cause chain may contain sensitive information.
   * The cause's message will not be visible in the {@link message} property.
   */
  readonly private?: boolean;

  /**
   * Create a plain {@link EError} instance with the given message.
   */
  constructor(message: string);

  /**
   * Create an {@link EError} instance with the given message and cause.
   * The message of the causing error will be added to this error's message.
   * Access the cause through the `.cause` property.
   *
   * @param message The error message.
   * @param error The causing error to wrap.
   */
  constructor(message: string, error: Cause);

  /**
   * Create an {@link EError} instance with the given message, cause and
   * any additional data passed in the `info` object. The message of the
   * causing error will be added to this error's message, unless `private`
   * is set to true in the `info` object.
   *
   * Access the cause through the `.cause` property, and the provided info
   * through the `.info` property.
   *
   * @param message The error message.
   * @param error The causing error to wrap.
   * @param info Additional data to pass to the error.
   */
  constructor(message: string, error: Cause, info: T & { private?: boolean });

  /**
   * Create an {@link EError} instance with the given message, cause and
   * any additional data passed in the `options` object. The message of the
   * causing error will be added to this error's message, unless `private`
   * is set to true in the `options` object.
   *
   * Access the cause through the `.cause` property, and the provided info
   * through the `.info` property.
   *
   * @param message The error message.
   * @param options Data to pass to the error, including the `cause`.
   */
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

  /**
   * Get the cause from an Error object if it exists.
   * If it does not exist, `null` will be returned.
   *
   * @param error The error to get the cause from.
   */
  static cause<T extends EError>(error: T): NonNullable<T["cause"]> | null;
  static cause(error: Error): Error | null;
  static cause(error: Error) {
    const cause = (error as any).cause;
    if (cause instanceof Error) return cause;
    return null;
  }

  readonly cause?: Cause;

  /**
   * Get the `info` property from an Error object if it exists.
   * If it does not exist, `null` will be returned.
   *
   * @param error The error to get the `info` object from.
   */
  static info<T extends EError>(error: T): NonNullable<T["info"]> | null;
  static info(error: Error): unknown | null;
  static info(error: Error) {
    return (error as any).info ?? null;
  }

  readonly info?: Omit<T, "cause" | "private">;

  /**
   * Find the first cause in the error's cause chain that matches the given name.
   *
   * @param error The error to find the cause in.
   * @param name The cause name to match.
   */
  static findCause(error: Error, name: string): Error | null;

  /**
   * Find the first cause in the error's cause chain that matches one of the given names.
   *
   * @param error The error to find the cause in.
   * @param names The cause names to match.
   */
  static findCause(error: Error, ...names: string[]): Error | null;

  static findCause(error: Error, ...names: string[]): Error | null {
    const causeNames = new Set(names);
    let errorCause: Error | null = error;
    while (errorCause) {
      if (causeNames.has(errorCause.name)) return errorCause;
      errorCause = EError.cause(errorCause);
    }
    return null;
  }

  /**
   * Find the first cause in the error's cause chain that matches the given name.
   *
   * @param name The cause name to match.
   */
  findCause(name: string): Error | null;

  /**
   * Find the first cause in the error's cause chain that matches one of the given names.
   *
   * @param names The cause names to match.
   */
  findCause(...names: string[]): Error | null;

  findCause(...names: string[]) {
    return EError.findCause(this, ...names);
  }

  /**
   * Find the first cause in the error's cause chain that satisfies the given predicate.
   *
   * @param error The error to find the cause in.
   * @param predicate The predicate to run on each cause in the cause chain. Return `true` to return the cause.
   */
  static findCauseIf(error: Error, predicate: (error: Error) => boolean) {
    let errorCause: Error | null = error;
    while (errorCause) {
      if (predicate(error)) return errorCause;
      errorCause = EError.cause(errorCause);
    }
    return null;
  }

  /**
   * Find the first cause in the error's cause chain that satisfies the given predicate.
   *
   * @param predicate The predicate to run on each cause in the cause chain. Return `true` to return the cause.
   */
  findCauseIf(predicate: (error: Error) => boolean) {
    return EError.findCauseIf(this, predicate);
  }

  /**
   * Find all the causes in the error's cause chain that match the given name.
   *
   * @param error The error to find the cause in.
   * @param name The cause name to match.
   */
  static findCauses(error: Error, name: string): Error[];

  /**
   * Find all the causes in the error's cause chain that match any of the given names.
   *
   * @param error The error to find the cause in.
   * @param names The cause names to match.
   */
  static findCauses(error: Error, ...names: string[]): Error[];

  static findCauses(error: Error, ...names: string[]) {
    const causeNames = new Set(names);
    const causes: Error[] = [];

    let errorCause: Error | null = error;
    while (errorCause) {
      if (causeNames.has(errorCause.name)) causes.push(errorCause);
      errorCause = EError.cause(errorCause);
    }

    return causes;
  }

  /**
   * Find all the causes in the error's cause chain that match the given name.
   *
   * @param name The cause name to match.
   */
  findCauses(name: string): Error[];

  /**
   * Find all the causes in the error's cause chain that match any of the given names.
   *
   * @param names The cause names to match.
   */
  findCauses(...names: string[]): Error[];

  findCauses(...names: string[]) {
    return EError.findCauses(this, ...names);
  }

  /**
   * Find the causes in the error's cause chain that satisfy the given predicate.
   *
   * @param error The error to find the cause in.
   * @param predicate The predicate to run on each cause in the cause chain. Return `true` to return the cause.
   */
  static findCausesIf(error: Error, predicate: (error: Error) => boolean) {
    const causes: Error[] = [];

    let errorCause: Error | null = error;
    while (errorCause) {
      if (predicate(error)) causes.push(error);
      errorCause = EError.cause(errorCause);
    }

    return causes;
  }

  /**
   * Find the causes in the error's cause chain that satisfy the given predicate.
   *
   * @param predicate The predicate to run on each cause in the cause chain. Return `true` to return the cause.
   */
  findCausesIf(predicate: (error: Error) => boolean) {
    return EError.findCausesIf(this, predicate);
  }

  /**
   * Returns `true` if a cause with the given name exists somewhere in the error's cause chain.
   *
   * @param error The error to find the cause in.
   * @param name The name of the cause to match.
   */
  static hasCause(error: Error, name: string): boolean;

  /**
   * Returns `true` if a cause that matches any of the given names exists somewhere in the error's cause chain.
   *
   * @param error The error to find the cause in.
   * @param names The name of the cause to match.
   */
  static hasCause(error: Error, ...names: string[]): boolean;

  static hasCause(error: Error, ...names: string[]) {
    return EError.findCause(error, ...names) !== null;
  }

  /**
   * Returns `true` if a cause with the given name exists somewhere in the error's cause chain.
   *
   * @param name The name of the cause to match.
   */
  hasCause(name: string): boolean;

  /**
   * Returns `true` if a cause that matches any of the given names exists somewhere in the error's cause chain.
   *
   * @param names The name of the cause to match.
   */
  hasCause(...names: string[]): boolean;

  hasCause(...names: string[]) {
    return EError.hasCause(this, ...names);
  }

  /**
   * Return the stack trace of the given error, including the stack traces of each cause in the cause chain.
   *
   * @param error The error to return the stack trace for.
   */
  static fullStack(error: Error): string {
    const causeError = EError.cause(error);
    if (causeError)
      return (
        (error.stack ?? EMPTY_STACK_TRACE) +
        "\n\n" +
        `caused by: ${EError.fullStack(causeError)}`
      );
    return error.stack ?? EMPTY_STACK_TRACE;
  }

  /**
   * Return the stack trace of the given error, including the stack traces of each cause in the cause chain.
   */
  fullStack() {
    return EError.fullStack(this);
  }

  /**
   * Convert a given error into a normalised JSON output format.
   *
   * @param error The error to convert to JSON.
   */
  static toJSON(
    error: Error,
    options: {
      /** If `true`, includes the stack trace in the output. */
      stack?: boolean;
      /** If `true`, only the top most error will be converted to JSON. The `cause` property will not be included. */
      shallow?: boolean;
    } = {}
  ): EErrorJSON {
    const { stack, shallow } = options;

    const json: EErrorJSON = {
      name: error.name,
      message: error.message,
    };

    if (error instanceof EError && error.summary) {
      json.summary = error.summary;
    }

    if (!shallow) {
      const errorCause = EError.cause(error);
      if (errorCause) {
        json.cause = EError.toJSON(errorCause, options);
      }
    }

    const errorInfo = EError.info(error);
    if (errorInfo) {
      json.info = errorInfo;
    }

    if (stack) {
      const stack = error.stack;
      if (stack) json.stack = stack.split("\n");
    }

    return json;
  }

  /**
   * Convert the error into a normalised JSON output format.
   */
  toJSON(options: { stack?: boolean; shallow?: boolean } = {}) {
    return EError.toJSON(this, options);
  }
}

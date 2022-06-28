/**
 * An {@link Error} object that has an optional `cause` field.
 *
 * This interface is provided to provide compatibiliy with older
 * versions of ECMAScript (ES2021 and below), as the `cause` field
 * was only implemented in ES2022.
 *
 * @see https://github.com/tc39/proposal-error-cause
 */
export type ErrorLike = Error & { cause?: Error };

export type EErrorOptions<
  T extends { [key: string]: any },
  Cause extends ErrorLike
> = {
  /**
   * A property indicating the specific cause of the error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
   */
  cause?: Cause;

  /**
   * Additional data to store in the error.
   */
  info?: T;
};

/**
 * Type for a class definition that creates an {@link ErrorLike} instance.
 */
export type ErrorLikeConstructor<T extends ErrorLike> = {
  new (...args: any[]): T;
};

/**
 * Normalised JSON format for errors.
 */
export type EErrorJSON = {
  name: string;
  message: string;
  originalMessage?: string;
  info?: any;
  cause?: EErrorJSON;
  stack?: string[];
};

const EMPTY_STACK_TRACE = "<stack trace empty>";

/**
 * An extension of the built-in {@link Error} class that allows you to wrap an
 * existing error as the cause and add structured data to help with debugging.
 *
 * @template T The shape of any structured data to pass to the error. Defaults to the arbitrary type `{ [key: string]: any }`.
 * @template Cause The error type that this error may wrap as a cause. Must extend the {@link ErrorLike} type.
 */
export class EError<
  T extends { [key: string]: any } = { [key: string]: any },
  Cause extends ErrorLike = ErrorLike
> extends Error {
  /**
   * The original message passed to the error constructor.
   */
  readonly originalMessage: string;

  /**
   * A property indicating the specific cause of the error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
   */
  override readonly cause?: Cause;

  readonly info?: T;

  /**
   * Create a plain {@link EError} instance with the given message.
   */
  constructor(message: string);

  /**
   * Create an {@link EError} instance with the given message and cause.
   * The message of the causing error will be appended to this error's message.
   *
   * @param message The error message.
   * @param cause The causing error to wrap.
   */
  constructor(message: string, cause: Cause);

  /**
   * Create an {@link EError} instance with the given message and cause.
   * The message of the causing error will be appended to this error's message.
   *
   * @param message The error message.
   * @param options Data to pass to the error, such as `cause` and `info`.
   */
  constructor(message: string, options: EErrorOptions<T, Cause>);

  // Implementation
  constructor(
    message: string,
    optionsOrCause?: EErrorOptions<T, Cause> | Cause
  ) {
    let _cause: Cause | undefined = undefined;
    let _info: T | undefined = undefined;

    // Normalise options
    if (optionsOrCause instanceof Error) {
      _cause = optionsOrCause;
    } else if (optionsOrCause) {
      const { cause, info } = optionsOrCause;
      _cause = cause;
      _info = info;
    }

    // Construct message
    if (!_cause) {
      super(message);
    } else {
      const causes = EError.getCauses(_cause);
      const messages = [message].concat(
        causes.map((cause) => {
          if (cause instanceof EError)
            return `${cause.name}: ${cause.originalMessage}`;
          return `${cause.name}: ${cause.message}`;
        })
      );
      super(messages.join(" > "));
    }

    // Set properties
    this.originalMessage = message;
    if (_cause) this.cause = _cause;
    if (_info) this.info = _info;

    // Provides compatibility with instanceof
    Object.setPrototypeOf(this, new.target.prototype);

    // Set the correct constructor name
    this.name = new.target.name;

    // Maintains proper stack trace for where the error is thrown (only works in V8)
    (Error as any).captureStackTrace?.(this, new.target);
  }

  /**
   * Get the cause chain of the error, including the error itself.
   *
   * @param error The error to get the cause chain from.
   * @param filter A function to filter the causes to return. Return `true` if an error in the chain should be included in the result.
   */
  static getCauses(
    error: ErrorLike | undefined,
    filter?: (error: ErrorLike) => boolean
  ): ErrorLike[] {
    const causes: ErrorLike[] = [];
    let currentError: ErrorLike | undefined = error;
    while (currentError) {
      if (!filter || filter(currentError)) causes.push(currentError);
      currentError = currentError.cause;
    }
    return causes;
  }

  /**
   * Get the cause chain of the error, including the error itself.
   *
   * @param filter A function to filter the causes to return. Return `true` if an error in the chain should be included in the result.
   */
  getCauses(filter?: (error: ErrorLike) => boolean): ErrorLike[] {
    return EError.getCauses(this, filter);
  }

  /**
   * Find the first occurence of provided error type in the error's cause chain,
   * including the error itself. If not found, `null` will be returned.
   *
   * @param error The error to get the cause chain from.
   * @param type The error type. Must be a class definition, such as {@link Error}.
   */
  static findCause<T extends Error>(
    error: ErrorLike | undefined,
    type: ErrorLikeConstructor<T>
  ): T | null {
    let errorCause: ErrorLike | undefined = error;
    while (errorCause) {
      if (errorCause instanceof type && errorCause.name === type.name)
        return errorCause;
      errorCause = (errorCause as ErrorLike).cause;
    }
    return null;
  }

  /**
   * Find the first occurence of provided error type in the error's cause chain
   * including the error itself. If not found, `null` will be returned.
   *
   * @param type The error type. Must be a class definition, such as {@link Error}.
   */
  findCause<T extends Error>(type: ErrorLikeConstructor<T>): T | null {
    return EError.findCause(this, type);
  }

  /**
   * Find all occurences of the provided error type in the error's cause chain,
   * including the error itself.
   *
   * @param error The error to get the cause chain from.
   * @param type The error type. Must be a class definition, such as {@link Error}.
   */
  static findCauses<T extends Error>(
    error: ErrorLike,
    type: ErrorLikeConstructor<T>
  ): T[] {
    return EError.getCauses(
      error,
      (e) => e instanceof type && e.name === type.name
    ) as T[];
  }

  /**
   * Find all occurences of the provided error type in the error's cause chain,
   * including the error itself.
   *
   * @param type The error type. Must be a class definition, such as {@link Error}.
   */
  findCauses<T extends Error>(type: ErrorLikeConstructor<T>): T[] {
    return EError.getCauses(
      this,
      (e) => e instanceof type && e.name === type.name
    ) as T[];
  }

  /**
   * Find the first occurrence of a cause that has the given name
   * in the error's cause chain, including the error itself.
   * If not found, `null` will be returned.
   *
   * @param error The error to get the cause chain from.
   * @param name The name of the error to find.
   */
  static findCauseByName(error: ErrorLike, name: string): ErrorLike | null {
    let errorCause: ErrorLike | undefined = error;
    while (errorCause) {
      if (errorCause instanceof Error && errorCause.name === name)
        return errorCause;
      errorCause = errorCause.cause;
    }
    return null;
  }

  /**
   * Find the first occurrence of a cause that has the given name
   * in the error's cause chain, including the error itself.
   * If not found, `null` will be returned.
   *
   * @param name The name of the error to find.
   */
  findCauseByName(name: string): ErrorLike | null {
    return EError.findCauseByName(this, name);
  }

  /**
   * Find all occurrences of a cause that has the given name
   * in the error's cause chain, including the error itself.
   * If not found, `null` will be returned.
   *
   * @param error The error to get the cause chain from.
   * @param name The name of the error to find.
   */
  static findCausesByName(error: ErrorLike, name: string): ErrorLike[] {
    return EError.getCauses(error, (e) => e.name === name);
  }

  /**
   * Find all occurrences of a cause that has the given name
   * in the error's cause chain, including the error itself.
   * If not found, `null` will be returned.
   *
   * @param name The name of the error to find.
   */
  findCausesByName(name: string): ErrorLike[] {
    return EError.findCausesByName(this, name);
  }

  /**
   * Return the stack trace of the error, including the stack traces
   * of each cause in the cause chain.
   *
   * @param error The error to get the full stack trace for.
   */
  static fullStack(error: ErrorLike): string {
    let stack = error.stack ?? EMPTY_STACK_TRACE;
    if (error.cause)
      stack += "\n\n" + `caused by: ${EError.fullStack(error.cause)}`;
    return stack;
  }

  /**
   * Return the stack trace of the error, including the stack traces
   * of each cause in the cause chain.
   */
  fullStack() {
    return EError.fullStack(this);
  }

  /**
   * Convert a given error into a normalised JSON output format.
   *
   * @param error The error to convert to JSON.
   * @param options Output options.
   */
  static toJSON(
    error: ErrorLike,
    options: {
      /** If `true`, includes the stack trace in the output. */
      stack?: boolean;
      /** If `true`, only the top most error will be converted to JSON. The `cause` property will be ommitted. */
      shallow?: boolean;
    } = {}
  ): EErrorJSON {
    const { stack, shallow } = options;

    const json: EErrorJSON = {
      name: error.name,
      message: error.message,
    };

    if (error instanceof EError && error.originalMessage) {
      json.originalMessage = error.originalMessage;
    }

    if (!shallow && error.cause) {
      json.cause = EError.toJSON(error.cause, options);
    }

    if (error instanceof EError && error.info) {
      json.info = error.info;
    }

    if (stack) {
      const stack = error.stack;
      if (stack) json.stack = stack.split("\n");
    }

    return json;
  }

  /**
   * Convert a given error into a normalised JSON output format.
   *
   * @param options Output options.
   */
  toJSON(
    options: {
      /** If `true`, includes the stack trace in the output. */
      stack?: boolean;
      /** If `true`, only the top most error will be converted to JSON. The `cause` property will not be included. */
      shallow?: boolean;
    } = {}
  ): EErrorJSON {
    return EError.toJSON(this, options);
  }
}

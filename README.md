# exceptional-errors

[![npm](https://img.shields.io/npm/v/exceptional-errors?style=flat-square)](https://www.npmjs.com/package/exceptional-errors)
[![license](https://img.shields.io/:license-mit-blue.svg?style=flat-square)](LICENSE)

**Richer errors with first-class Typescript support.**

Errors are much more pleasant to handle when you have the right information.
This package aims to make it **easier** and **quicker** for the developer to
create custom errors and wrap existing errors with context, so that when they
appear, you can work out why.

Also highly recommend checking out this article on errors and exception handling
best-practices, which helped drive some of the design decisions in this package:
[Error Handling in Node.js (Joyent)](https://console.joyent.com/node-js/production/design/errors)

## Features

- Zero dependencies
- First-class Typescript support
- Compatible with Node.js and Browser (ES6+)
- Extends the built-in `Error` class
- Extendable to create custom classes (with the correct class name!)
- Works as you'd expect with the `instanceof` operator, even when extended
- Chainable error messages and causes (searchable too!)
- Add type-safe structured data to the error
- Transform error objects into a structured JSON representation

## Live demo

See the examples in the **Quickstart** section below in action on CodeSandbox.

[![exceptional-errors-demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/exceptional-errors-demo-xse4mm?expanddevtools=1&fontsize=14&module=%2Fsrc%2Findex.ts&theme=dark)

## Quickstart

Install the package using your favourite package manager.

```sh
npm install exceptional-errors
yarn add exceptional-errors
pnpm add exceptional-errors
```

#### Example 1

Import the base class **EError**. You can use this as a drop-in replacement for
the built-in Error class.

```ts
import { EError } from "exceptional-errors";

const error = new EError("oh no!");
console.log(error);
```

This prints:

```
EError: oh no!
```

#### Example 2

You can use **EError** it to wrap existing errors to give context for where
errors originate from if they are passed up through your exception handlers.

```ts
const error = new Error("it was my fault");
console.log(new EError("something went wrong", error));
```

This prints:

```
EError: something went wrong: it was my fault
```

#### Example 3

Pass a cause and structured data to **EError** to make it easier to
programatically handle and process errors. You can easily access the `cause` and
`info` for debugging.

```ts
const cause = new EError("invalid credentials");
const error = new EError("failed login", cause, {
  username: "obiwan",
  date: Date.now(),
});

// Note: You can access error.cause and error.info
// directly if you are dealing with EError instances
console.log(error);
console.log(EError.cause(error));
console.log(EError.info(error));
```

This prints:

```
EError: failed login: invalid credentials
EError: invalid credentials
{ username: "obiwan", date: 1656146150075 }
```

#### Example 4

Easily extend the **EError** class to make your own error classes. You can also
use the `toJSON()` to get a JSON representation of the error.

```ts
class CustomRequestError extends EError<{
  code: number;
  path: string;
}> {}

const originalError = new EError("parameter x is invalid");

const error = new CustomRequestError("bad request", originalError, {
  code: 400,
  path: "/test-endpoint",
});

// Note: You can call error.toJSON() directly if you are dealing with EError instances
console.log(error);
console.log(EError.toJSON(error));
```

This prints:

```
CustomRequestError: bad request: parameter x is invalid
{
  name: "CustomRequestError",
  message: "bad request: parameter x is invalid",
  summary: "bad request",
  cause: {
    name: "EError",
    message: "parameter x is invalid"
  },
  info: {
    code: 400,
    path: "/test-endpoint"
  }
}
```

#### Example 5

To use **private mode**, which hides the cause's error from the top-level
error's message, pass `{ private: true }` in the error's info. This will keep
the cause's error message hidden from the stack trace if the error is ever
thrown. However, you can still access the `cause` by using `.cause` or
`EError.cause()` for debugging purposes.

For those who have used
[verror](https://github.com/TritonDataCenter/node-verror#verror-rich-javascript-errors),
this provides similar functionality to `WError`.

```ts
const secretError = new EError("sensitive error");
const publicError = new EError("something went wrong", {
  cause: secretError,
  private: true,
});

console.log(publicError);
console.log(EError.cause(publicError));
```

This prints:

```
EError: something went wrong
EError: sensitive error
```

## API Reference

The main export from this package is the `EError` class. Use it as a
constructor, or access static methods which can be used on error objects. The
`EError` class is generic with the following definition:

```ts
class EError<T extends Info, Cause extends Error> extends Error {
  // name: string - inherited from Error
  // message: string - inherited from Error
  // stack?: string - inherited from Error
  summary?: string;
  private?: boolean;
  cause?: Cause;
  info?: Omit<T, "cause" | "private">;
  // -- instance methods omitted --
}

type Info = { [key: string]: any };
```

which means you can define the type of the data stored in `info` through the
type parameter `T`, as well as the cause type through the type parameter
`Cause`. By default these generics are inferred, so you don't need to define
them unless you want to restrict them.

### Constructors

The definitions below assume that `T` is the type of the `info` property, and
`Cause` is the type of the `cause` property.

```ts
/**
 * Create a plain EError instance with the given message.
 */
new EError(message: string)

/**
 * Create an EError instance with the given message and cause.
 * The message of the causing error will be appended to this
 * error's message.
 *
 * @param message The error message.
 * @param error The causing error to wrap.
 */
new EError(message: string, error: Cause)

/**
 * Create an EError instance with the given message, cause and
 * any additional data passed in the `info` object. The message
 * of the causing error will be appended to this error's message
 * unless `private` is set to true in the `info` object.
 *
 * @param message The error message.
 * @param error The causing error to wrap.
 * @param info Additional data to pass to the error.
 */
new EError(message: string, error: Cause, info: T)

/**
 * Create an EError instance with the given message, cause and
 * any additional data passed in the `options` object. The message
 * of the causing error will be appended to this error's message
 * unless `private` is set to true in the `options` object.
 *
 * @param message The error message.
 * @param options Data to pass to the error, including the `cause`.
 */
new EError(message: string, options: { cause?: Cause, ...info: T })
```

### Properties on an `EError` instance

| Property  | Type     | Description                                                                                                                                                                                                                                                                                                                                    |
| --------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | string   | A name for the error type. This value can be used to programatically differentiate between different types of errors. If you extend the `EError` class, the name property will be the name of the new subclass.                                                                                                                                |
| `message` | string   | The error message. Provided when the error is instantiated, and will have the message of the `cause` appended (if available) unless the `private` option is set to true.                                                                                                                                                                       |
| `stack`   | string?  | The stack trace. Populated by the JavaScript engine.                                                                                                                                                                                                                                                                                           |
| `cause`   | `Cause`? | A reference to the error that this error is wrapping. May be undefined if this error is not wrapping another error.                                                                                                                                                                                                                            |
| `info`    | `T`?     | Arbitrary data that was passed to the error. May be undefined if no data was passed to the error.                                                                                                                                                                                                                                              |
| `private` | boolean? | Indicates if the error was in private mode. In private mode, the cause's message is not appended to the error message. Enable private mode by passing `{ private: true }` in the error's info object. This is useful if you want to hide lower-level messages from being exposed when printed, but still have them accessible programatically. |
| `summary` | string?  | The original error message without the `cause`'s error message appended. May be undefined if no `cause` is available.                                                                                                                                                                                                                          |

### Methods on an `EError` instance

The following methods are available on any `EError` instance.

#### `findCause(...names: string[]): Error | null`

Finds the first cause in the error's cause chain that matches any of the given
names. Returns `null` if no matching cause is found.

#### `findCauseIf(predicate: (error: Error) => boolean): Error | null`

Find the first cause in the error's cause chain that satisfies the given
predicate. Returns `null` if no cause satisfies the predicate.

#### `findCauses(...names: string[]): Error[]`

Find all the causes in the error's cause chain that match any of the given
names.

#### `findCausesIf(predicate: (error: Error) => boolean): Error[]`

Find all the causes in the error's cause chain that satisfy the given predicate.

#### `hasCause(...names: string[]): boolean`

Returns `true` if a cause that matches any of the given names exists somewhere
in the error's cause chain.

#### `fullStack(): string`

Return the stack trace of the given error, including the stack traces of each
cause in the cause chain.

#### `toJSON(): EErrorJSON`

Convert a given error into a normalised JSON output format. The shape of the
JSON output is as follows:

```ts
type EErrorJSON = {
  name: string;
  message: string;
  summary?: string;
  info?: any;
  cause?: EErrorJSON;
  stack?: string[];
};
```

### Static methods on `EError`

All methods available on an `EError` instance are also available as static
methods on the `EError` class, with the only difference being that the first
argument should be the `error` object you want to use it on.

The static versions of the class methods are safe to use with **any** error
object, not only errors that inherit `EError`.

## Aren't there already packages that do this?

Yes, there are plenty (see some of the inspirations for this package below). But
all in all, there wasn't one that quite fit all of the things on my wishlist -
for example, some don't have first-class Typescript support, some have APIs that
are not as lean as I would like them to be. So here I am, with my own
implementation, heavily inspired by all of my favourite features from other
similar packages.

I highly encourage you to have a look at some of the other packages out there as
they might just fit your needs better than what I've designed here. No hard
feelings!

### Inspiration

- [VError](https://www.npmjs.com/package/verror)
- [error](https://www.npmjs.com/package/error)
- [extendable-error](https://www.npmjs.com/package/extendable-error)
- [ts-error](https://www.npmjs.com/package/ts-error)

## License

See [LICENSE](LICENSE)

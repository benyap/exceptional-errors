# exceptional-errors

[![npm](https://img.shields.io/npm/v/exceptional-errors?style=flat-square)](https://www.npmjs.com/package/exceptional-errors)
[![license](https://img.shields.io/:license-mit-blue.svg?style=flat-square)](LICENSE)

**Richer errors with first-class Typescript support.**

Errors are much more pleasant to handle when you have the right information.
This package aims to make it **easier** and **quicker** for the developer to
create custom errors and wrap existing errors with context, so that when they
appear, you can work out why.

## Features

- Zero dependencies
- First-class Typescript support
- Compatible with Node.js and Browser (ES6+), including ES2022
  [Error.cause](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
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

```log
EError: oh no!
```

#### Example 2

You can use **EError** to wrap existing errors to give context for where errors
originate from if they are passed up through your exception handlers.

```ts
const cause = new Error("it was my fault");
const error = new EError("something went wrong", cause);
console.log(error);
```

This prints:

```log
EError: something went wrong > Error: it was my fault
```

#### Example 3

Pass a cause and structured data to **EError** to make it easier to
programatically handle and process errors. You can easily access the `cause` and
`info` for debugging.

```ts
const cause = new EError("invalid credentials");
const error = new EError("failed login", {
  cause,
  info: {
    username: "obiwan",
    date: Date.now(),
  },
});

console.log(error);
console.log(error.cause);
console.log(error.info);
```

This prints:

```log
EError: failed login > EError: invalid credentials
EError: invalid credentials
{ username: "obiwan", date: 1656146150075 }
```

#### Example 4

Easily extend the **EError** class to make your own error classes. The `name`
property will be automatically set correctly, and you can use `instanceof` to
check the type hierarchy.

```ts
class CustomError extends EError {}

const error = new EError("parameter x is invalid");
const wrapped = new CustomError("bad request", error);

console.log(wrapped.name);
console.log(wrapped);
console.log(error.name);
console.log(error);

console.log("wrapped instanceof CustomError", wrapped instanceof CustomError);
console.log("wrapped instanceof EError", wrapped instanceof EError);
console.log("wrapped instanceof Error", wrapped instanceof Error);
```

This prints:

```log
CustomError
CustomError: bad request > EError: parameter x is invalid
EError
EError: parameter x is invalid
wrapped instanceof CustomError true
wrapped instanceof EError true
wrapped instanceof Error true
```

#### Example 5

Use the `toJSON()` method to get a JSON representation of the error, which can
be handy if you want to serialize an error and pass it to a monitoring system or
database.

```ts
class CustomRequestError extends EError<{
  code: number;
  path: string;
}> {}

const cause = new EError("parameter x is invalid");
const error = new CustomRequestError("bad request", {
  cause,
  info: {
    code: 400,
    path: "/test-endpoint",
  },
});

console.log(error.toJSON());
```

This prints:

```log
{
  name: "CustomRequestError",
  message: "bad request > EError: parameter x is invalid",
  originalMessage: "bad request",
  cause: {
    name: "EError",
    message: "parameter x is invalid",
    originalMessage: "parameter x is invalid",
  },
  info: {
    code: 400,
    path: "/test-endpoint"
  }
}
```

### Example 6

Use the `findCause(type)` function to check if an error type exists somewhere in
an error's cause chain. More utility functions are available, and are listed in
the API reference.

```ts
class MyError extends EError {}

const root = new MyError("root cause", new Error("internal"));
const intermediate = new EError("intermediate cause", root);
const error = new EError("top level error", intermediate);

console.log(error.findCause(MyError));
```

This prints:

```log
MyError: root cause > Error: internal
```

## API Reference

The main export from this package is the `EError` class. Use it as a
constructor, or access static methods which can be used on error objects.

The `EError` class is generic, meaning you can specify the exact type of the
`info` and `cause` if it suits your needs. If you are using the `EError` class
directly, the generics are inferred, so you don't need to define them.
Alternatively, if you are extending the `EError` class, you may want to pass on
the generics for improved type support, or define them to restrict them.

```ts
class EError<T = unknown, Cause extends Error = Error> {
  // ...
}
```

```ts
import { EError } from "exceptional-errors";

// Pass on the generics
class MyCustomError<T, Cause extends Error> extends EError<T, Cause> {
  // ...
}

// Or define them explicitly for your error
class MyCustomError extends EError<{ code: number }> {
  // ...
}
```

### Constructors

```ts
/**
 * Create an EError instance with an empty message.
 */
new EError()

/**
 * Create an EError instance with the given message.
 */
new EError(message: string)

/**
 * Create an EError instance with the given cause and an empty message.
 */
new EError(error: Cause)

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
 * Create an EError instance with the given message and cause.
 * The message of the causing error will be appended to this error's message.
 *
 * @param message The error message.
 * @param options Data to pass to the error, such as `cause` and `info`.
 */
new EError(message: string, options: { cause?: Cause, info?: T })
```

### Properties on an `EError` instance

| Property          | Type     | Description                                                                                                                   |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`            | string   | A name for the error type. This value can be used to programatically differentiate between different types of errors.         |
| `message`         | string   | The error message. Provided when the error is instantiated, and will have the message of the `cause` appended (if available). |
| `stack`           | string?  | The stack trace. Populated by the JavaScript engine.                                                                          |
| `originalMessage` | string   | The original error message passed to the constructor, without the `cause`'s message appended.                                 |
| `cause`           | `Cause`? | A reference to the error that this error is wrapping. May be undefined if this error is not wrapping another error.           |
| `info`            | `T`?     | Data that was passed to the error. May be undefined if no data was passed to the error.                                       |

### Methods on an `EError` instance

The following methods are available on any `EError` instance.

#### getCauses

```ts
class EError {
  // ...
  getCauses(filter?: (error: Error) => boolean): Error[];
}
```

Get the cause chain of the error, including the error itself. You can pass a
filter function to filter the returned results.

#### findCause, findCauses

```ts
class EError {
  // ...
  findCause<T extends Error>(type: AnyErrorConstructor<T>): T | null;
  findCauses<T extends Error>(type: AnyErrorConstructor<T>): T[];
}
```

Find the first occurence or all occurrences of provided error type in the
error's cause chain, including the error itself. If not found, `null` or an
empty array will be returned. `type` should be a class definition, such as the
built-in `Error` class, `EError`, or a custom error class.

#### findCauseByName, findCausesByName

```ts
class EError {
  // ...
  findCauseByName(name: string): Error | null;
  findCausesByName(name: string): Error[];
}
```

Find the first occurrence or all occurrences of a cause that has the given name
in the error's cause chain, including the error itself. If not found, `null` or
an empty array will be returned.

#### fullStack

```ts
class EError {
  // ...
  fullStack(): string;
}
```

Return the stack trace of the given error, including the stack traces of each
cause in the cause chain.

#### toJSON

```ts
class EError {
  // ...
  toJSON(options: { stack?: boolean; shallow?: boolean }): EErrorJSON;
}

type EErrorJSON = {
  name: string;
  message: string;
  stack?: string[];
  originalMessage?: string;
  cause?: EErrorJSON;
  info?: any;
};
```

Convert a given error into a normalised JSON output format. Set `stack` to true
to include the stack trace in the output. Set `shallow` to true to only include
the top most error (the `cause` property will be omitted).

The stack trace is split by the newline character (`\n`) into an array of
strings.

### Static methods on `EError`

All methods available on an `EError` instance are also available as static
methods on the `EError` class, with the only difference being that the first
argument should be the `error` object you want to use it on.

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

## Tests

This package has been tested to be compatible with ES6 and CommonJS. To run the
tests in this module, you'll need to clone this repository and install the
development dependencies.

To run tests for CommonJS and Typescript run the following command:

```
pnpm test
```

To run the tests for ES6 in a browser, run the following command:

```
pnpm test:browser
```

## Contributors

Thanks goes to these wonderful people
([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/benyap"><img src="https://avatars.githubusercontent.com/u/19235373?v=4?s=80" width="80px;" alt=""/><br /><sub><b>Ben Yap</b></sub></a><br /><a href="https://github.com/benyap/exceptional-errors/commits?author=benyap" title="Code">💻</a> <a href="https://github.com/benyap/exceptional-errors/commits?author=benyap" title="Tests">⚠️</a> <a href="https://github.com/benyap/exceptional-errors/commits?author=benyap" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/benedictong42"><img src="https://avatars.githubusercontent.com/u/29601676?v=4?s=80" width="80px;" alt=""/><br /><sub><b>benedictong42</b></sub></a><br /><a href="#ideas-benedictong42" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the
[all-contributors](https://github.com/all-contributors/all-contributors)
specification. Contributions of any kind welcome!

## License

See [LICENSE](LICENSE)

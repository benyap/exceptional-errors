# exceptional-errors

[![npm](https://img.shields.io/npm/v/exceptional-errors?style=flat-square)](https://www.npmjs.com/package/exceptional-errors)
[![license](https://img.shields.io/:license-mit-blue.svg?style=flat-square)](LICENSE)

**Richer errors with first-class Typescript support.**

Errors are much more pleasant to handle when you have the right information.
This package aims to make it **easier** and **quicker** for the developer to
create custom errors and wrap existing errors with context, so that when they
appear, you can work out why.

Also some suggested reading on errors and exception handling best-practices,
which helped drive some of the design decisions in this package:
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

## Quickstart

Install the package using your favourite package manager.

```sh
npm install exceptional-errors
yarn add exceptional-errors
pnpm add exceptional-errors
```

Import the base class **EError**. You can use this as a drop-in replacement for
the built-in Error class.

```ts
import { EError } from "exceptional-errors";

console.log(new EError("oh no!"));
```

This prints:

```
EError: oh no!
```

You can use **EError** it to wrap existing errors to build context for where
errors originate from if they are passed up through your exception handlers.

```ts
const error = new Error("it was my fault");

console.log(new EError("something went wrong", error));
```

This prints:

```
EError: something went wrong: it was my fault
```

Pass structured data to an error to make it eaiser to programatically handle and
process errors. You can easily access the `cause` and `info` for debugging.

```ts
const authError = new EError("invalid credentials");
const error = new EError("failed login", authError, {
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

Easily extend the **EError** class to make your own error classes. You can even
add type checks to your classes if it suits your use case. Additionally, you can
use the `toJSON()` to get a JSON representation of the error.

```ts
class CustomRequestError extends EError<{
  method: "GET" | "POST";
  code: number;
  path: string;
}> {}

const error = new CustomRequestError(
  "bad request",
  new EError("parameter x is invalid"),
  {
    method: "GET",
    code: 400,
    path: "/bad-endpoint",
  }
);

// Note: You can call error.toJSON() directly if you are dealing with EError instances
console.log(error);
console.log(Error.toJSON(error));
```

This prints:

```
CustomRequestError: bad request: parameter x is invalid
{
  name: "CustomRequestError",
  message: "bad request: parameter x is invalid",
  summary: "bad request",
  cause: {
    name: "Error",
    message: "parameter x is invalid"
  },
  info: {
    method: "GET",
    code: 400,
    path: "/bad-endpoint"
  }
}
```

## API

> ⚠️ Documentation in the README is currently a work in progress. However,
> everything is documented in Typescript so your code editor should be able to
> help you out.

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

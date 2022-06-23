# exceptional

> ⚠️ This project is a work in progress.

Richer errors with first-class Typescript support.

## Features (currently a wishlist)

- First-class Typescript support
- Compatible with Node.js and Browser
- Zero dependencies
- Extends the built-in `Error` class
- Extendable to create custom classes that have the correct class name and works with `instanceof`
- Chainable error messages and causes
- Custom error properties

## Motivation

Errors are much more pleasant to handle when you have the right information. This package aims to
make it **easier** and **quicker** for the developer to create custom errors and wrap existing
errors with context, so that when they appear, you can work out why.

_Aren't there already packages that do this?_

Yes, there are plenty (see some of the inspirations for this package below). But all in all, there
wasn't one that quite fit all of the things on my wishlist - for example, some don't have
first-class Typescript support, some have APIs that are not as lean as I would like them to be. So
here I am, with my own implementation, heavily inspired by all of my favourite features from other
similar packages.

I highly encourage you to have a look at some of the other packages out there as they might just fit
your needs better than what I've designed here. No hard feelings!

## API

> Work in progress.

## Inspiration

- [VError](https://www.npmjs.com/package/verror)
- [error](https://www.npmjs.com/package/error)
- [extendable-error](https://www.npmjs.com/package/extendable-error)
- [ts-error](https://www.npmjs.com/package/ts-error)

## License

See [LICENSE](LICENSE)

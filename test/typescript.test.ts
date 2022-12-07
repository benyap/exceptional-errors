import { EError } from "../src/index";

// Example 1
{
  const error = new EError("oh no!");
  console.log(error);
}

// Example 2
{
  const cause = new Error("it was my fault");
  const error = new EError("something went wrong", cause);
  console.log(error);
}

// Example 3
{
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
}

// Example 4
{
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
}

// Example 5
{
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
}

// Example 6
{
  class MyError extends EError {}

  const root = new MyError("root cause", new Error("internal"));
  const intermediate = new EError("intermediate cause", root);
  const error = new EError("top level error", intermediate);

  console.log(error.findCause(MyError));
}

// Other Typescript scenarios that should compile
{
  // Test constructors
  new EError();
  new EError("message");
  new EError("message", {});
  new EError("message", new Error());
  new EError("message", { cause: new Error(), info: [] });
  new EError(new Error());
  new EError({ cause: new Error(), info: 10 });
}

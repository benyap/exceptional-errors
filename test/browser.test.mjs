const expect = chai.expect;

import { EError } from "../dist/esm/index.js";

class CustomError extends EError {}

describe("instanceof", () => {
  it("new EError() instanceof Error", () => {
    expect(new EError()).to.be.instanceof(Error);
  });

  it("new EError() instanceof EError", () => {
    expect(new EError()).to.be.instanceof(EError);
  });

  it("new CustomError() instanceof CustomError", () => {
    expect(new CustomError()).to.be.instanceof(CustomError);
  });

  it("new CustomError() instanceof EError", () => {
    expect(new CustomError()).to.be.instanceof(EError);
  });

  it("new CustomError() instanceof Error", () => {
    expect(new CustomError()).to.be.instanceof(Error);
  });
});

describe(".name", () => {
  it("new EError() has the correct name", () => {
    expect(new EError().name).equals("EError");
  });

  it("new CustomError() has the correct name", () => {
    expect(new CustomError().name).equals("CustomError");
  });
});

describe(".message", () => {
  it("new EError() has empty message", () => {
    const error = new EError();
    expect(error.message).equals("");
  });

  it("new EError(message) has the correct message", () => {
    const error = new EError("my error message");
    expect(error.message).equals("my error message");
  });

  it("new EError(message, error) has the correct message", () => {
    const error = new EError("my error message", new Error("inner"));
    expect(error.message).equals("my error message: inner");
  });

  it("new CustomError(message, error) has the correct message", () => {
    const error = new CustomError("my error message", new EError("inner"));
    expect(error.message).equals("my error message: inner");
  });

  it("new CustomError(message, { cause }) has the correct message", () => {
    const error = new CustomError("my error message", {
      cause: new EError("inner"),
    });
    expect(error.message).equals("my error message: inner");
  });

  it("new CustomError(message, nested error) has the correct message", () => {
    const error = new CustomError("my error message", new EError("inner"));
    const nestedError = new CustomError("top level", error);
    expect(nestedError.message).equals("top level: my error message: inner");
  });

  it("private hides message chain in new EError(message, nested error)", () => {
    const error = new CustomError("my error message", new EError("inner"));
    const nestedError = new CustomError("top level", error, { private: true });
    expect(nestedError.message).equals("top level");
  });
});

describe(".summary", () => {
  it("new EError() has empty summary", () => {
    const error = new EError();
    expect(error.summary).is.undefined;
  });

  it("new EError(message) has empty summary", () => {
    const error = new EError("my error message");
    expect(error.summary).is.undefined;
  });

  it("new EError(message, error) has correct summary", () => {
    const error = new EError("my error message", new EError("nested message"));
    expect(error.summary).equals("my error message");
  });

  it("private new EError(message, error) has empty summary", () => {
    const error = new EError("my error message", new EError("nested message"), {
      private: true,
    });
    expect(error.summary).is.undefined;
  });
});

describe(".private", () => {
  it(".private is undefined when not provided", () => {
    const error = new EError();
    expect(error.private).to.be.undefined;
  });

  it(".private is undefined when provided as false", () => {
    const error = new EError("my error message", { private: false });
    expect(error.private).to.be.undefined;
  });

  it(".private is true when provided as true", () => {
    const error = new EError("my error message", { private: true });
    expect(error.private).to.be.true;
  });
});

describe(".info", () => {
  it("new EError().info is undefined", () => {
    const error = new EError();
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, error).info is undefined", () => {
    const error = new EError("message", new Error());
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, error, {}).info is undefined", () => {
    const error = new EError("message", new Error(), {});
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, error, { private }).info is undefined", () => {
    const error = new EError("message", new Error(), {
      private: true,
    });
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, { cause }).info is undefined", () => {
    const error = new EError("message", { cause: new Error() });
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, { cause, private }).info is undefined", () => {
    const error = new EError("message", {
      cause: new Error(),
      private: false,
    });
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, { cause, private }).info is undefined", () => {
    const error = new EError("message", {
      cause: new Error(),
      private: false,
    });
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, { data }).info has correct data", () => {
    const error = new EError("message", { data: [] });
    expect(error.info).to.deep.equal({ data: [] });
  });

  it("new EError(message, { cause, data }).info has correct data", () => {
    const error = new EError("message", { cause: new Error(), data: [] });
    expect(error.info).to.deep.equal({ data: [] });
  });

  it("new EError(message, cause, { data }).info has correct data", () => {
    const error = new EError("message", new Error(), { data: [] });
    expect(error.info).to.deep.equal({ data: [] });
  });
});

describe(".stack", () => {
  it("new EError(message) shows correct stack trace", () => {
    const error = new EError("my error message");
    const lines = error.stack.split("\n");
    expect(lines[0]).to.equal("EError: my error message");
    lines.slice(1).forEach((line) => expect(line).to.match(/ +at .+/));
  });

  it("new EError(message, cause) shows correct stack trace", () => {
    const error = new EError("my error message", new Error("inner"));
    const lines = error.stack.split("\n");
    expect(lines[0]).to.equal("EError: my error message: inner");
    lines.slice(1).forEach((line) => expect(line).to.match(/ +at .+/));
  });
});

describe("EError.cause()", () => {
  it("EError.cause(new Error()) returns null", () => {
    expect(EError.cause(new Error())).to.be.null;
  });

  it("EError.cause(new EError()) returns null", () => {
    expect(EError.cause(new EError())).to.be.null;
  });

  it("EError.cause(new EError(message, message)) returns null since cause is not an error", () => {
    const error = new EError("message", "hello");
    expect(EError.cause(error)).to.be.null;
  });

  it("EError.cause(new EError(message, cause)) returns the correct cause", () => {
    const cause = new Error();
    const error = new EError("message", cause);
    expect(EError.cause(error)).to.equal(cause);
  });

  it("EError.cause(new EError(message, cause, info)) returns the correct cause", () => {
    const cause = new Error();
    const error = new EError("message", cause, { data: [] });
    expect(EError.cause(error)).to.equal(cause);
  });

  it("EError.cause(new EError(message, { cause })) returns the correct cause", () => {
    const cause = new Error();
    const error = new EError("message", { cause });
    expect(EError.cause(error)).to.equal(cause);
  });

  it("EError.cause(EError.cause(error)) chains correctly", () => {
    const cause1 = new EError("cause 1");
    const cause2 = new EError("cause 2", cause1);
    const error = new EError("error", cause2);
    expect(EError.cause(error)).to.equal(cause2);
    expect(EError.cause(error).cause).to.equal(cause1);
    expect(EError.cause(EError.cause(error))).to.equal(cause1);
    expect(EError.cause(EError.cause(error)).cause).to.be.undefined;
  });
});

describe("EError.info()", () => {
  it("EError.info(new Error()) returns null", () => {
    expect(EError.info(new Error())).to.be.null;
  });

  it("EError.info(new EError()) returns null", () => {
    expect(EError.info(new EError())).to.be.null;
  });

  it("EError.info(new EError(message, cause)) returns null", () => {
    const cause = new Error();
    const error = new EError("message", cause);
    expect(EError.info(error)).to.equal(null);
  });

  it("EError.info(new EError(message, { cause })) returns null", () => {
    const cause = new Error();
    const error = new EError("message", { cause });
    expect(EError.info(error)).to.be.null;
  });

  it("EError.info(new EError(message, cause, info)) returns the correct info", () => {
    const cause = new Error();
    const error = new EError("message", cause, { data: [] });
    expect(EError.info(error)).to.deep.equal({ data: [] });
  });

  it("EError.info(new EError(message, { cause, ...data })) returns the correct info", () => {
    const cause = new Error();
    const error = new EError("message", { cause, data: [] });
    expect(EError.info(error)).to.deep.equal({ data: [] });
  });
});

describe("EError.findCause()", () => {
  it("returns the right cause when it exists at the top level", () => {
    const error = new CustomError("error", new EError());
    const cause = error.findCause(CustomError.name);
    expect(cause).to.equal(error);
  });

  it("returns the right cause when it exists down the cause chain", () => {
    const target = new CustomError("target", new EError("other"));
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const cause = EError.findCause(error, CustomError.name);
    expect(cause).to.equal(target);
  });

  it("returns null when the cause does not exist", () => {
    const inner = new EError("inner");
    const error = new EError("error", inner);
    const cause = error.findCause(CustomError.name);
    expect(cause).to.be.null;
  });
});

describe("EError.findCauseIf()", () => {
  it("returns the right cause when it exists at the top level", () => {
    const error = new CustomError(
      "error",
      new EError("inner", { target: "me" }),
      { target: "me" }
    );
    const cause = error.findCauseIf((e) => e.info.target === "me");
    expect(cause).to.equal(error);
  });

  it("returns the right cause when it exists down the cause chain", () => {
    const target = new CustomError("target", new EError("other"));
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const cause = EError.findCauseIf(error, (e) => e.name === CustomError.name);
    expect(cause).to.equal(target);
  });

  it("returns null when the cause does not exist", () => {
    const inner = new EError("inner");
    const error = new EError("error", inner);
    const cause = error.findCauseIf((e) => e.message === "message");
    expect(cause).to.be.null;
  });
});

describe("EError.findCauses()", () => {
  it("returns the right causes when they exist", () => {
    const other = new EError("other");
    const target = new CustomError("target", other);
    const inner = new EError("inner", target);
    const error = new CustomError("error", inner);
    const causes = EError.findCauses(error, CustomError.name);
    expect(causes).to.contain(error);
    expect(causes).to.contain(target);
    expect(causes).to.not.contain(inner);
    expect(causes).to.not.contain(other);
  });

  it("returns empty when the right causes do not exist", () => {
    const other = new EError("other");
    const target = new EError("target", other);
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const causes = EError.findCauses(error, CustomError.name);
    expect(causes).to.be.empty;
  });
});

describe("EError.findCausesIf()", () => {
  it("returns the right causes when they exist", () => {
    const other = new EError("other", { data: 1 });
    const target = new CustomError("target", other, { data: 2 });
    const inner = new EError("inner", target);
    const error = new CustomError("error", inner, { data: 5 });
    const causes = EError.findCausesIf(error, (e) => e?.info?.data > 1);
    expect(causes).to.contain(error);
    expect(causes).to.contain(target);
    expect(causes).to.not.contain(inner);
    expect(causes).to.not.contain(other);
  });

  it("returns empty when the right causes do not exist", () => {
    const other = new EError("other");
    const target = new EError("target", other);
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const causes = EError.findCausesIf(error, (e) => e?.info?.data > 1);
    expect(causes).to.be.empty;
  });
});

describe("EError.hasCause()", () => {
  it("returns true when it exists at the top level", () => {
    const error = new CustomError("error", new EError("inner"));
    const cause = error.hasCause("CustomError");
    expect(cause).to.be.true;
  });

  it("returns true when it exists down the cause chain", () => {
    const target = new CustomError("target", new EError("other"));
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const cause = EError.hasCause(error, CustomError.name);
    expect(cause).to.be.true;
  });

  it("returns false when the cause does not exist", () => {
    const inner = new EError("inner");
    const error = new EError("error", inner);
    const cause = error.hasCause("CustomError");
    expect(cause).to.be.false;
  });
});

describe("EError.fullStack()", () => {
  it("EError.fullStack(error) shows correct stack trace", () => {
    const error = new EError("my error message");
    const lines = error.fullStack().split("\n");
    expect(lines[0]).to.equal("EError: my error message");
    lines.slice(1).forEach((line) => expect(line).to.match(/ +at .+/));
  });

  it("EError.fullStack(error) shows correct stack trace with nested causes", () => {
    const root = new Error("root");
    const inner = new EError("inner error", root);
    const error = new EError("my error message", inner);
    const lines = error.fullStack().split("\n");
    expect(lines).to.contain("EError: my error message: inner error: root");
    expect(lines).to.contain("caused by: EError: inner error: root");
    expect(lines).to.contain("caused by: Error: root");
  });
});

describe("EError.toJSON()", () => {
  it("EErorr(new Error()).toJSON() shows correct output", () => {
    expect(EError.toJSON(new Error("my error message"))).to.deep.equal({
      name: "Error",
      message: "my error message",
    });
  });

  it("new EError(message).toJSON() shows correct output", () => {
    const error = new EError("my error message");
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message",
    });
  });

  it("new EError(message, cause).toJSON() shows correct output", () => {
    const cause = new CustomError("cause");
    const error = new EError("my error message", cause);
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message: cause",
      summary: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
      },
    });
  });

  it("new EError(message, cause, info).toJSON() shows correct output", () => {
    const cause = new CustomError("cause");
    const error = new EError("my error message", cause, { data: [1, 2, 3] });
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message: cause",
      summary: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
      },
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, ...info }).toJSON() shows correct output", () => {
    const cause = new CustomError("cause", { data: "hello" });
    const error = new EError("my error message", { cause, data: [1, 2, 3] });
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message: cause",
      summary: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
        info: { data: "hello" },
      },
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, ...info }).toJSON({ shallow }) shows correct output", () => {
    const cause = new CustomError("cause", { data: "hello" });
    const error = new EError("my error message", { cause, data: [1, 2, 3] });
    expect(error.toJSON({ shallow: true })).to.deep.equal({
      name: "EError",
      message: "my error message: cause",
      summary: "my error message",
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, ...info }).toJSON({ stack }) shows correct output", () => {
    const inner = new CustomError("cause", { data: "hello" });
    const error = new EError("my error message", {
      cause: inner,
      data: [1, 2, 3],
    });
    {
      const { stack, cause, ...json } = error.toJSON({ stack: true });
      expect(json).to.deep.equal({
        name: "EError",
        message: "my error message: cause",
        summary: "my error message",
        info: { data: [1, 2, 3] },
      });
      expect(stack).to.contain("EError: my error message: cause");

      {
        const { stack, ...json } = cause;
        expect(json).to.deep.equal({
          name: "CustomError",
          message: "cause",
          info: { data: "hello" },
        });
        expect(stack).to.contain("CustomError: cause");
      }
    }
  });
});

describe("stringify", () => {
  it("new EError(message) shows correct message when stringified", () => {
    const error = new EError("my error message");
    expect(String(error)).to.equal("EError: my error message");
  });

  it("new EError(message, cause) shows correct message chain when stringified", () => {
    const root = new EError("root");
    const inner = new EError("inner error", root);
    const error = new EError("my error message", inner);
    expect(String(error)).to.equal(
      "EError: my error message: inner error: root"
    );
  });

  it("new EError(message, causeWithPrivate) shows correct messages when stringifed", () => {
    const root = new EError("root");
    const inner = new EError("inner error", root, { private: true });
    const error = new EError("my error message", inner);
    expect(String(error)).to.equal("EError: my error message: inner error");
  });
});

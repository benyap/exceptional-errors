const { describe, it } = require("mocha");
const expect = require("chai").expect;

const { EError } = require("../build/cjs");

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
    expect(error.message).equals(`my error message > Error: inner`);
  });

  it("new CustomError(message, error) has the correct message", () => {
    const error = new CustomError("my error message", new EError("inner"));
    expect(error.message).equals(`my error message > EError: inner`);
  });

  it("new CustomError(message, { cause }) has the correct message", () => {
    const error = new CustomError("my error message", {
      cause: new EError("inner"),
    });
    expect(error.message).equals(`my error message > EError: inner`);
  });

  it("new CustomError(message, nested error) has the correct message", () => {
    const error = new CustomError("my error message", new EError("inner"));
    const nestedError = new CustomError("top level", error);
    expect(nestedError.message).equals(
      `top level > CustomError: my error message > EError: inner`
    );
  });
});

describe(".originalMessage", () => {
  it("new EError() has empty originalMessage", () => {
    const error = new EError();
    expect(error.originalMessage).is.undefined;
  });

  it("new EError(message) has correct originalMessage", () => {
    const error = new EError("my error message");
    expect(error.originalMessage).equals("my error message");
  });

  it("new EError(message, error) has correct originalMessage", () => {
    const error = new EError("my error message", new EError("nested message"));
    expect(error.originalMessage).equals("my error message");
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

  it("new EError(message, { cause }).info is undefined", () => {
    const error = new EError("message", { cause: new Error() });
    expect(error.info).to.be.undefined;
  });

  it("new EError(message, { info: data }).info has correct data", () => {
    const error = new EError("message", { info: { key: "field" } });
    expect(error.info).to.deep.equal({ key: "field" });
  });

  it("new EError(message, { cause, info: data }).info has correct data", () => {
    const error = new EError("message", {
      cause: new Error(),
      info: { key: "field" },
    });
    expect(error.info).to.deep.equal({ key: "field" });
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
    expect(lines[0]).to.equal(`EError: my error message > Error: inner`);
    lines.slice(1).forEach((line) => expect(line).to.match(/ +at .+/));
  });
});

describe("getCauses()", () => {
  it("finds all causes", () => {
    const root = new EError("root");
    const inner = new CustomError("inner", root);
    const middle = new EError("middle", inner);
    const error = new EError("outer", middle);
    const causes = error.getCauses();
    expect(causes).to.deep.equal([error, middle, inner, root]);
  });

  it("finds all causes using filter", () => {
    const root = new EError("root");
    const inner = new CustomError("inner", root);
    const middle = new EError("middle", inner);
    const error = new EError("outer", middle);
    const causes = EError.getCauses(error, (e) => e.name !== CustomError.name);
    expect(causes).to.deep.equal([error, middle, root]);
  });
});

describe("findCause()", () => {
  it("returns the right cause when it exists at the top level", () => {
    const error = new CustomError("error", new EError());
    const cause = error.findCause(CustomError);
    expect(cause).to.equal(error);
  });

  it("returns the right cause when it exists down the cause chain", () => {
    const target = new CustomError("target", new EError("other"));
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const cause = EError.findCause(error, CustomError);
    expect(cause).to.equal(target);
  });

  it("returns null when the cause does not exist", () => {
    const inner = new EError("inner");
    const error = new EError("error", inner);
    const cause = error.findCause(CustomError);
    expect(cause).to.be.null;
  });
});

describe("findCauses()", () => {
  it("returns the right causes when they exist", () => {
    const other = new EError("other");
    const target = new CustomError("target", other);
    const inner = new EError("inner", target);
    const error = new CustomError("error", inner);
    const causes = EError.findCauses(error, CustomError);
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
    const causes = EError.findCauses(error, CustomError);
    expect(causes).to.be.empty;
  });
});

describe("findCauseByName()", () => {
  it("returns the right cause when it exists at the top level", () => {
    const error = new CustomError("error", new EError());
    const cause = error.findCauseByName("CustomError");
    expect(cause).to.equal(error);
  });

  it("returns the right cause when it exists down the cause chain", () => {
    const target = new CustomError("target", new EError("other"));
    const inner = new EError("inner", target);
    const error = new EError("error", inner);
    const cause = EError.findCauseByName(error, "CustomError");
    expect(cause).to.equal(target);
  });

  it("returns null when the cause does not exist", () => {
    const inner = new EError("inner");
    const error = new EError("error", inner);
    const cause = error.findCauseByName("CustomError");
    expect(cause).to.be.null;
  });
});

describe("findCausesByName()", () => {
  it("returns the right causes when they exist", () => {
    const other = new EError("other");
    const target = new CustomError("target", other);
    const inner = new EError("inner", target);
    const error = new CustomError("error", inner);
    const causes = EError.findCausesByName(error, "CustomError");
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
    const causes = error.findCausesByName("CustomError");
    expect(causes).to.be.empty;
  });
});

describe("fullStack()", () => {
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
    expect(lines).to.contain(
      "EError: my error message > EError: inner error > Error: root"
    );
  });
});

describe("toJSON()", () => {
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
      originalMessage: "my error message",
    });
  });

  it("new EError(message, cause).toJSON() shows correct output", () => {
    const cause = new CustomError("cause");
    const error = new EError("my error message", cause);
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message > CustomError: cause",
      originalMessage: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
        originalMessage: "cause",
      },
    });
  });

  it("new EError(message, cause, info).toJSON() shows correct output", () => {
    const cause = new CustomError("cause");
    const error = new EError("my error message", {
      cause,
      info: { data: [1, 2, 3] },
    });
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message > CustomError: cause",
      originalMessage: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
        originalMessage: "cause",
      },
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, info }).toJSON() shows correct output", () => {
    const cause = new CustomError("cause", { info: { data: "hello" } });
    const error = new EError("my error message", {
      cause,
      info: { data: [1, 2, 3] },
    });
    expect(error.toJSON()).to.deep.equal({
      name: "EError",
      message: "my error message > CustomError: cause",
      originalMessage: "my error message",
      cause: {
        name: "CustomError",
        message: "cause",
        originalMessage: "cause",
        info: { data: "hello" },
      },
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, info }).toJSON({ shallow }) shows correct output", () => {
    const cause = new CustomError("cause", { info: { data: "hello" } });
    const error = new EError("my error message", {
      cause,
      info: { data: [1, 2, 3] },
    });
    expect(error.toJSON({ shallow: true })).to.deep.equal({
      name: "EError",
      message: "my error message > CustomError: cause",
      originalMessage: "my error message",
      info: { data: [1, 2, 3] },
    });
  });

  it("new EError(message, { cause, info }).toJSON({ stack }) shows correct output", () => {
    const inner = new CustomError("cause", { info: { data: "hello" } });
    const error = new EError("my error message", {
      cause: inner,
      info: { data: [1, 2, 3] },
    });
    {
      const { stack, cause, ...json } = error.toJSON({ stack: true });
      expect(json).to.deep.equal({
        name: "EError",
        message: "my error message > CustomError: cause",
        originalMessage: "my error message",
        info: { data: [1, 2, 3] },
      });
      expect(stack).to.contain("EError: my error message > CustomError: cause");

      {
        const { stack, ...json } = cause;
        expect(json).to.deep.equal({
          name: "CustomError",
          message: "cause",
          originalMessage: "cause",
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
      "EError: my error message > EError: inner error > EError: root"
    );
  });
});

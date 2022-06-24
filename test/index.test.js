const { it, describe } = require("mocha");
const expect = require("chai").expect;

const { EError } = require("../dist/cjs");

describe("instanceof", () => {
  it("new EError() instanceof Error", () => {
    expect(new EError()).to.be.instanceof(Error);
  });

  it("new EError() instanceof EError", () => {
    expect(new EError()).to.be.instanceof(EError);
  });
});

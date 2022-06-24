const expect = chai.expect;

import { EError } from "../dist/esm/index.js";

describe("instanceof", () => {
  it("new EError() instanceof Error", () => {
    expect(new EError()).to.be.instanceof(Error);
  });

  it("new EError() instanceof EError", () => {
    expect(new EError()).to.be.instanceof(EError);
  });
});

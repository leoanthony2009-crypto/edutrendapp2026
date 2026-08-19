import { describe, expect, it } from "vitest";
import { triageFreeText } from "../triage";

describe("triageFreeText", () => {
  it("labels empty and everyday text routine", () => {
    expect(triageFreeText("")).toBe("routine");
    expect(triageFreeText("great class today, all smiles")).toBe("routine");
  });

  it("notices fatigue and struggle language", () => {
    expect(triageFreeText("I am worried about the marking load")).toBe("noticing");
    expect(triageFreeText("feeling exhausted this week")).toBe("noticing");
  });

  it("flags concern language", () => {
    expect(triageFreeText("One boy said he felt unsafe at break")).toBe("concerned");
    expect(triageFreeText("A pupil came to school hungry again")).toBe("concerned");
  });

  it("flags explicit safeguarding language as alarmed", () => {
    expect(triageFreeText("She said she is afraid to go home")).toBe("alarmed");
  });
});

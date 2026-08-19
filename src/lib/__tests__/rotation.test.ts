import { describe, expect, it } from "vitest";
import { rotateStudentBank } from "../rotation";
import { DEFAULT_BANKS } from "../../data/questionBanks";

describe("rotateStudentBank", () => {
  const bank = DEFAULT_BANKS.student;

  it("returns 5 questions per day for the default bank", () => {
    for (let seed = 0; seed <= 6; seed++) {
      expect(rotateStudentBank(bank, seed)).toHaveLength(5);
    }
  });

  it("includes the weekly reflection every day (as the fifth slot)", () => {
    for (let seed = 0; seed <= 6; seed++) {
      const qs = rotateStudentBank(bank, seed);
      expect(qs.some((q) => q.weekly)).toBe(true);
    }
  });

  it("rotates different daily questions across seeds", () => {
    const monday = rotateStudentBank(bank, 1).map((q) => q.id).join(",");
    const tuesday = rotateStudentBank(bank, 2).map((q) => q.id).join(",");
    expect(monday).not.toBe(tuesday);
  });

  it("is deterministic for the same seed (whole class sees the same set)", () => {
    expect(rotateStudentBank(bank, 3)).toEqual(rotateStudentBank(bank, 3));
  });

  it("returns small banks unrotated", () => {
    const small = bank.slice(0, 4);
    expect(rotateStudentBank(small, 4)).toEqual(small);
  });
});

import { describe, expect, it } from "vitest";
import { findDanglingReferences } from "../src/lib/references";

const theme = { collection: "themes", id: "energy", data: { title: "E" } };

describe("findDanglingReferences", () => {
  it("accepts references to existing entries", () => {
    const person = {
      collection: "people",
      id: "jane-doe",
      data: { themes: [{ collection: "themes", id: "energy" }] },
    };
    expect(findDanglingReferences([theme, person])).toEqual([]);
  });

  it("reports references to missing entries with their path", () => {
    const project = {
      collection: "projects",
      id: "p1",
      data: {
        themes: [{ collection: "themes", id: "energy" }],
        people: [{ collection: "people", id: "ghost" }],
        start: new Date("2025-01-01"),
      },
    };
    expect(findDanglingReferences([theme, project])).toEqual([
      "projects/p1 (people[0]) → missing people/ghost",
    ]);
  });
});

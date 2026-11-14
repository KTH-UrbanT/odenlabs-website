import { describe, expect, it } from "vitest";
import { compareBySurname, surname } from "../src/lib/people";

describe("surname", () => {
  it.each([
    ["Kateryna Pereverza", "Pereverza"],
    ["Oleksii  Pasichnyi ", "Pasichnyi"],
    ["Lukas Dahlström", "Dahlström"],
    ["Anna-Lena Svensson", "Svensson"],
    ["Madonna", "Madonna"],
    ["", ""],
  ])("takes the last word of %j", (name, expected) => {
    expect(surname(name)).toBe(expected);
  });
});

describe("compareBySurname", () => {
  const sorted = (names: string[]) => [...names].sort(compareBySurname);

  it("orders by surname, not by first name", () => {
    expect(
      sorted([
        "Shadaab Ghani",
        "Oleksii Pasichnyi",
        "Hossein Shahrokni",
        "Mohammadhossein Alizadeh",
        "Lukas Dahlström",
        "Kateryna Pereverza",
      ]),
    ).toEqual([
      "Mohammadhossein Alizadeh",
      "Lukas Dahlström",
      "Shadaab Ghani",
      "Oleksii Pasichnyi",
      "Kateryna Pereverza",
      "Hossein Shahrokni",
    ]);
  });

  it("ignores case and breaks a surname tie by the whole name", () => {
    expect(sorted(["Eva Berg", "anna berg", "Carl Aberg"])).toEqual([
      "Carl Aberg",
      "anna berg",
      "Eva Berg",
    ]);
  });

  it("sorts å, ä and ö after z, as Swedish does", () => {
    expect(sorted(["Karl Östlund", "Eva Zander", "Olle Ek"])).toEqual([
      "Olle Ek",
      "Eva Zander",
      "Karl Östlund",
    ]);
  });
});

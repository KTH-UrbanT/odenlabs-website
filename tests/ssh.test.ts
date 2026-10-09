import { describe, expect, it } from "vitest";
import { localExecutor } from "../deploy/ssh.ts";

describe("executor", () => {
  it("reports the exit status of a command that fails without reading its input", () => {
    const big = Buffer.alloc(8 * 1024 * 1024, 1);
    const r = localExecutor().run("echo boom >&2; exit 2", big);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("boom");
  });

  it("still throws when the input is cut short but the command exits 0", () => {
    const big = Buffer.alloc(8 * 1024 * 1024, 1);
    expect(() => localExecutor().run("exit 0", big)).toThrow(/EPIPE/);
  });
});

import { describe, expect, it } from "vitest";
import { targetFromEnv } from "../deploy/publish.ts";

const ssh = {
  SSH_HOST: "host.example.test",
  SSH_USERNAME: "deploy",
  SSH_PRIVATE_KEY: "key",
  SSH_TARGET_DIR: "/srv/site",
};

describe("targetFromEnv", () => {
  it("writes locally when asked, with no key", () => {
    expect(
      targetFromEnv({
        PUBLISH_MODE: "local",
        TARGET_DIR: "/srv/odenlabs/public",
      }),
    ).toEqual({ mode: "local", targetDir: "/srv/odenlabs/public" });
  });

  it("ignores the SSH secrets in local mode", () => {
    const target = targetFromEnv({
      ...ssh,
      PUBLISH_MODE: "local",
      TARGET_DIR: "/srv/a",
    });
    expect(target).toEqual({ mode: "local", targetDir: "/srv/a" });
  });

  it.each(["", "/", "//", "relative/dir", "./here", "public"])(
    "rejects the local target %j",
    (dir) => {
      expect(() =>
        targetFromEnv({ PUBLISH_MODE: "local", TARGET_DIR: dir }),
      ).toThrow(/TARGET_DIR/);
    },
  );

  it("needs the target in local mode", () => {
    expect(() => targetFromEnv({ PUBLISH_MODE: "local" })).toThrow(
      /missing environment variable TARGET_DIR/,
    );
  });

  it("uses SSH by default and requires all four values", () => {
    expect(targetFromEnv(ssh)).toEqual({
      mode: "ssh",
      targetDir: "/srv/site",
      host: "host.example.test",
      user: "deploy",
      privateKey: "key",
    });
    for (const name of Object.keys(ssh)) {
      const partial: Record<string, string> = { ...ssh };
      delete partial[name];
      expect(() => targetFromEnv(partial)).toThrow(name);
    }
  });

  it("refuses an unknown mode instead of guessing", () => {
    expect(() => targetFromEnv({ ...ssh, PUBLISH_MODE: "Local" })).toThrow(
      /unknown PUBLISH_MODE/,
    );
  });
});

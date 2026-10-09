// A thin seam between the publish shell and the server (ADR-0002). An
// Executor runs one shell command in the server's account: over the runner's
// OpenSSH in production, through the local `sh` in tests. Commands are fixed
// strings built by publish.ts; server-side file names never appear in them,
// they travel only as NUL-separated data on stdin or stdout.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface RunResult {
  status: number;
  stdout: Buffer;
  stderr: string;
}

export interface Executor {
  run(command: string, input?: Buffer): RunResult;
}

/** Quotes a value for a POSIX shell. Used only for the target folder. */
export function shq(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const MAX_OUTPUT = 256 * 1024 * 1024;

function result(r: ReturnType<typeof spawnSync>): RunResult {
  // A command that fails without reading its input closes the pipe early:
  // report its own exit status and stderr. With exit 0 the input may have
  // been cut short, so that stays an error.
  const closedEarly =
    (r.error as NodeJS.ErrnoException | undefined)?.code === "EPIPE" &&
    r.status !== null &&
    r.status !== 0;
  if (r.error && !closedEarly) throw r.error;
  return {
    status: r.status ?? 1,
    stdout: r.stdout as Buffer,
    stderr: (r.stderr as Buffer).toString("utf8"),
  };
}

/** Runs commands with the local `sh`: the test double for the server. */
export function localExecutor(): Executor {
  return {
    run: (command, input) =>
      result(
        spawnSync("sh", ["-c", command], { input, maxBuffer: MAX_OUTPUT }),
      ),
  };
}

/**
 * Runs commands over SSH with a key that exists only for this run. The host
 * key is accepted on first use: the runner starts with no known hosts.
 */
export function sshExecutor(config: {
  host: string;
  user: string;
  privateKey: string;
}): Executor & { close(): void } {
  const dir = mkdtempSync(join(tmpdir(), "publish-ssh-"));
  const keyFile = join(dir, "key");
  const key = config.privateKey.endsWith("\n")
    ? config.privateKey
    : `${config.privateKey}\n`;
  writeFileSync(keyFile, key, { mode: 0o600 });
  const base = [
    "-i",
    keyFile,
    "-o",
    "BatchMode=yes",
    "-o",
    "IdentitiesOnly=yes",
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    `UserKnownHostsFile=${join(dir, "known_hosts")}`,
    "-l",
    config.user,
    "--",
    config.host,
  ];
  return {
    run: (command, input) =>
      result(
        spawnSync("ssh", [...base, command], { input, maxBuffer: MAX_OUTPUT }),
      ),
    close: () => rmSync(dir, { recursive: true, force: true }),
  };
}

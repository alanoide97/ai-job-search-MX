import { describe, test, expect } from "bun:test";
import { runCLI } from "./helpers.js";

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

describe("Get on Board CLI flag validation", () => {
  test("unknown flag exits 1 with UNKNOWN_FLAG", async () => {
    const result = await runCLI(["search", "-q", "test", "--bogus-flag", "xyz"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toBe("");
    const error = parsedStderr(result.stderr);
    expect(error.code).toBe("UNKNOWN_FLAG");
  });

  test("--jobage NaN exits 1 with BAD_ARG", async () => {
    const result = await runCLI(["search", "-q", "test", "--jobage", "foo"]);
    expect(result.exitCode).not.toBe(0);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("no subcommand prints help and exits 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
  });

  test("detail without id exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("NO_ID");
  });
});

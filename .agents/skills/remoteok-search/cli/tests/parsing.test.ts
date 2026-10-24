import { describe, test, expect } from "bun:test";
import { toResult, cleanHtml } from "../src/helpers";

// Offline test of the reshaping + the double-encoded UTF-8 fix.
const FIXTURE = {
  id: "1137062",
  slug: "remote-desarrollador-full-stack-1137062",
  position: "DESARROLLADOR FULL STACK",
  company: "Kruger NearShore LLC - Rekluti",
  location: "Remote",
  date: "2026-08-22T00:00:12+00:00",
  tags: ["full stack", "devops", "python"],
  // RemoteOK serves descriptions double-encoded as UTF-8: the real text
  // "líder" arrives on the wire as the mojibake string "lÃ­der" (latin1 of the
  // UTF-8 bytes). We emulate that exactly here.
  description: "En Rekluti , consultora lÃ­der mundial en LATAM.",
  apply_url: "https://remoteok.com/remote-jobs/remote-desarrollador-full-stack-1137062",
  salary_min: 0,
  salary_max: 0,
};

describe("RemoteOK reshape", () => {
  const r = toResult(FIXTURE as any);

  test("carries id/title/company/location", () => {
    expect(r.id).toBe("1137062");
    expect(r.title).toBe("DESARROLLADOR FULL STACK");
    expect(r.company).toBe("Kruger NearShore LLC - Rekluti");
    expect(r.location).toBe("Remote");
    expect(r.date).toBe("2026-08-22");
  });

  test("tags pass through", () => {
    expect(r.tags).toEqual(["full stack", "devops", "python"]);
  });

  test("0-0 salary is treated as undisclosed (null), not literal $0", () => {
    expect(r.salary).toBeNull();
  });

  test("double-encoded UTF-8 description is repaired", () => {
    // The fixture's "líder" would be mojibake; after fix it must be clean.
    expect(r.description).toContain("líder mundial");
    expect(r.description).not.toContain("Ã");
  });

  test("cleanHtml strips tags", () => {
    expect(cleanHtml("<p>Hello</p><br>World")).toContain("Hello");
    expect(cleanHtml("")).toBeNull();
  });
});

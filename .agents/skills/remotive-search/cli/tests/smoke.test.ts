import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers.js";

interface SearchResponse {
  meta: {
    count: number;
    total: number;
    page: number;
    limit: number;
  };
  results: Array<{
    id: string;
    title: string;
    company: string | null;
    location: string | null;
    date: string | null;
    url: string;
    tags: string[];
    description: string | null;
    salary: string | null;
  }>;
}

describe("Remotive CLI live smoke test", () => {
  test("search returns valid json with expected structure", async () => {
    const result = await runCLI(["search", "-q", "support", "--limit", "2"]);
    expect(result.exitCode).toBe(0);

    const json = parseJSON<SearchResponse>(result);
    expect(json.meta).toBeDefined();
    expect(json.meta.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(json.results)).toBe(true);

    const first = json.results[0];
    expect(first.id).toBeDefined();
    expect(typeof first.title).toBe("string");
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.url.startsWith("http")).toBe(true);
  });
});

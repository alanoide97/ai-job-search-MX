import { describe, test, expect } from "bun:test";
import { parseJobCards } from "../src/helpers";

// Offline parser test using a realistic Indeed MX search HTML fragment.
// No network — guards the card parser against markup drift.
const SAMPLE = `
<a id="job_d44e22015516c193" data-jk="d44e22015516c193" href="/rc/clk?jk=d44e22015516c193"><span title="AI Support Engineer /REMOTO">AI Support Engineer /REMOTO</span></a>
</h3>
<div class="company_location css-o9i1wn e37uo190"><div><div class="css-1afmp4o e37uo190"><span data-testid="company-name" class="css-19eicqx eu4oa1w0">Acme Corp</span></div><div data-testid="text-location" class="css-1f06pz4 eu4oa1w0">Monterrey, N. L.</div></div>
<div data-jk="next"></div>
<a id="job_abc123" data-jk="abc123def456" href="/rc/clk?jk=abc123def456"><span title="DevOps Engineer">DevOps Engineer</span></a>
</h3>
<div class="company_location"><div><span data-testid="company-name">Globex</span></div><div data-testid="text-location">Remoto</div></div>
`;

describe("Indeed MX card parser", () => {
  const cards = parseJobCards(SAMPLE);

  test("extracts both cards", () => {
    expect(cards.length).toBe(2);
  });

  test("first card title + company + location", () => {
    const c = cards[0];
    expect(c.id).toBe("d44e22015516c193");
    expect(c.title).toBe("AI Support Engineer /REMOTO");
    expect(c.company).toBe("Acme Corp");
    expect(c.location).toBe("Monterrey, N. L.");
    expect(c.url).toBe("https://mx.indeed.com/viewjob?jk=d44e22015516c193");
  });

  test("second card parses too", () => {
    const c = cards[1];
    expect(c.id).toBe("abc123def456");
    expect(c.title).toBe("DevOps Engineer");
    expect(c.company).toBe("Globex");
    expect(c.location).toBe("Remoto");
  });

  test("empty html yields no cards", () => {
    expect(parseJobCards("")).toEqual([]);
  });
});

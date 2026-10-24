import { describe, test, expect } from "bun:test";
import { parseJobCards } from "../src/helpers";

// Offline parser test using a realistic OCC search HTML fragment.
// No network — guards the card parser against markup drift.
const SAMPLE = `
<div class="card-job-offer is-highlighted" tabindex="0" data-id='21301252' id="jobcard-21301252">
  <h2 class="text-grey-900 text-lg break-words inline-block mt-0 mr-2 mb-0 ellipsis"> Responsable de Salud y Bienestar Ocupacional </h2>
  <span class="mr-2 text-grey-900 font-base font-light mb-2 sm:mb-4"> $ 35,000 Mensual </span>
  <div class="col-span-10">
    <span class="line-clamp-title">
      <a href="https://www.occ.com.mx/empleos/bolsa-de-trabajo-Adecco/" class="text-grey-900"> Adecco </a>
    </span>
    <div class="no-alter-loc-text mt-1">
      <p class="text-grey-900 m-0 text-sm font-light">Tijuana, Baja California</p>
    </div>
  </div>
</div>
<div class="card-job-offer" data-id='21308774'>
  <h2>Analista Sr. de Datos y Riesgos</h2>
  <a href="https://www.occ.com.mx/empleos/bolsa-de-trabajo-Banorte/"> Banorte </a>
  <div class="no-alter-loc-text"><p>Cuauhtémoc, Ciudad de México</p></div>
</div>
`;

describe("OCC card parser", () => {
  const cards = parseJobCards(SAMPLE);

  test("extracts both cards", () => {
    expect(cards.length).toBe(2);
  });

  test("first card title + company + location", () => {
    const c = cards[0];
    expect(c.id).toBe("21301252");
    expect(c.title).toBe("Responsable de Salud y Bienestar Ocupacional");
    expect(c.company).toBe("Adecco");
    expect(c.location).toBe("Tijuana, Baja California");
    expect(c.url).toBe("https://www.occ.com.mx/empleos/21301252");
  });

  test("accents preserved in second card", () => {
    const c = cards[1];
    expect(c.title).toBe("Analista Sr. de Datos y Riesgos");
    expect(c.company).toBe("Banorte");
    expect(c.location).toBe("Cuauhtémoc, Ciudad de México");
  });

  test("empty html yields no cards", () => {
    expect(parseJobCards("")).toEqual([]);
  });
});

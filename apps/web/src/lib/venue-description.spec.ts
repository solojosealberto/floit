import assert from "node:assert/strict";
import test from "node:test";
import { parseVenueDescription } from "./venue-description";

const SAMPLE = `Tipo: Gimnasio de Entrenamiento Funcional y Musculación
Actividades: Entrenamiento Funcional, Levantamiento de pesas
Amenidades: Duchas , vestidores
Horario: Lun-Vie: 5:45 AM – 9:00 PM | Sáb: 9:00 AM – 4:00 PM.
Instagram: @sweatgymchacao
Calificación (fuente): 4.5 / 5
Ubicación: cache: https://www.google.com/maps/place/Sweat+Gym/@10.4926693,-66.857848,17z

— Catálogo QueGym (importación normalizada).`;

test("parseVenueDescription elimina metadatos ops y extrae secciones", () => {
  const parsed = parseVenueDescription(SAMPLE);

  assert.equal(
    parsed.venueType,
    "Gimnasio de Entrenamiento Funcional y Musculación",
  );
  assert.deepEqual(parsed.activities, [
    "Entrenamiento Funcional",
    "Levantamiento de pesas",
  ]);
  assert.equal(parsed.instagramHandle, "@sweatgymchacao");
  assert.equal(parsed.instagramUrl, "https://instagram.com/sweatgymchacao");
  assert.ok(parsed.summary);
  assert.ok(!parsed.summary!.includes("cache:"));
  assert.ok(!parsed.summary!.includes("Calificación"));
  assert.ok(!parsed.summary!.includes("Catálogo QueGym"));
});

test("parseVenueDescription con texto vacío", () => {
  const parsed = parseVenueDescription(null);
  assert.equal(parsed.summary, null);
  assert.equal(parsed.activities.length, 0);
});

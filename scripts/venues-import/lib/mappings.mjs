/** Mapeo categorías / amenidades / actividades (español) → taxonomía QueGym. */

const CATEGORY_TYPE_RULES = [
  [/^pilates$/i, "pilates"],
  [/estudio\s+de\s+pilates|centro\s+de\s+pilates/i, "pilates"],
  [/^yoga$/i, "yoga"],
  [/shala|meditaci/i, "yoga"],
  [/cycling|spinning|xtreme\s*bike|indoor\s*bike|training\s*bike/i, "cycling"],
  [/crossfit|cross\s*fit|\bbox\b/i, "functional"],
  [/personal|entrenador\s+personal/i, "personal_training"],
  [/funcional|functional|híbrido|hibrido|entrenamiento\s+funcional/i, "functional"],
  [/club\s+deportivo|padel/i, "mixed"],
  [
    /gimnasio|fitness|musculaci|integral|fuerza|boutique|24\s*horas|bienestar|wellness/i,
    "gym",
  ],
];

const ACTIVITY_TYPE_RULES = [
  [/crossfit|cross\s*fit/i, "functional"],
  [/spinning|cycling|xtreme\s*bike/i, "cycling"],
  [/^yoga$/i, "yoga"],
  [/^pilates$/i, "pilates"],
];

/** Prioriza la categoría del negocio; no clasifica un gimnasio integral como pilates por una actividad secundaria. */
export function mapVenueType(category, activities = "") {
  const cat = String(category ?? "").trim();
  const act = String(activities ?? "").trim();

  for (const [re, type] of CATEGORY_TYPE_RULES) {
    if (cat && re.test(cat)) return type;
  }

  const genericCat =
    !cat || /^(fitness|integral|boutique|bienestar|centro|wellness)$/i.test(cat);
  if (!genericCat) return "gym";

  if (act) {
    const first = act.split(/[,;|/]+/)[0]?.trim() ?? "";
    for (const [re, type] of ACTIVITY_TYPE_RULES) {
      if (re.test(first)) return type;
    }
  }
  return "gym";
}

const MODALITY_MAP = new Map([
  ["musculación", "gym-floor"],
  ["musculacion", "gym-floor"],
  ["levantamiento de pesas", "weightlifting"],
  ["entrenamiento funcional", "functional"],
  ["crossfit", "cross-training"],
  ["cross training", "cross-training"],
  ["cycling", "cycling"],
  ["spinning", "cycling"],
  ["xtremebike", "cycling"],
  ["yoga", "yoga"],
  ["pilates", "pilates"],
  ["boxeo", "boxing"],
  ["kickboxing", "kickboxing"],
  ["mma", "mma"],
  ["karate", "martial-arts"],
  ["zumba", "dance-fitness"],
  ["baile terapia", "dance-fitness"],
  ["natación", "swimming"],
  ["natacion", "swimming"],
  ["escalada", "climbing"],
  ["trx", "functional"],
  ["calistenia", "calisthenics"],
  ["pole fitness", "pole-fitness"],
  ["padel", "padel"],
  ["tela acrobatica", "aerial"],
  ["tela acrobática", "aerial"],
  ["senderismo", "outdoor"],
  ["personal-training", "personal-training"],
  ["entrenamiento personal", "personal-training"],
]);

const AMENITY_MAP = new Map([
  ["estacionamiento", "parking"],
  ["parking", "parking"],
  ["valet parking", "valet-parking"],
  ["duchas", "showers"],
  ["vestidores", "locker-room"],
  ["lockers", "lockers"],
  ["sauna", "sauna"],
  ["piscina", "pool"],
  ["cafetería", "cafe"],
  ["cafeteria", "cafe"],
  ["terraza", "terrace"],
  ["wifi", "wifi"],
  ["seguridad", "security"],
  ["baños", "restrooms"],
  ["banos", "restrooms"],
  ["asesoría nutricional", "nutrition"],
  ["asesoria nutricional", "nutrition"],
  ["fisioterapia", "physio"],
  ["entrenamiento personal", "personal-training-area"],
  ["spa", "spa"],
  ["muro de escaladas", "climbing-wall"],
  ["baby gym", "kids-area"],
]);

export function mapModalities(activitiesText, category = "") {
  const slugs = new Set();
  const parts = splitList(activitiesText);
  if (parts.length === 0 && category) parts.push(category);
  for (const part of parts) {
    const key = part.toLowerCase().trim();
    for (const [needle, slug] of MODALITY_MAP) {
      if (key.includes(needle)) slugs.add(slug);
    }
  }
  if (slugs.size === 0) {
    const vt = mapVenueType(category, activitiesText);
    if (vt === "pilates") slugs.add("pilates");
    else if (vt === "yoga") slugs.add("yoga");
    else if (vt === "cycling") slugs.add("cycling");
    else if (vt === "functional") slugs.add("functional");
    else slugs.add("gym-floor");
  }
  return [...slugs].slice(0, 24);
}

export function mapAmenities(amenitiesText) {
  const slugs = new Set();
  for (const part of splitList(amenitiesText)) {
    const key = part.toLowerCase().trim();
    for (const [needle, slug] of AMENITY_MAP) {
      if (key.includes(needle)) slugs.add(slug);
    }
  }
  return [...slugs].slice(0, 40);
}

function splitList(text) {
  return String(text ?? "")
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

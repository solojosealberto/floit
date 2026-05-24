import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PromotionEntity } from "../promotions/promotion.entity";
import { TaxonomyService } from "../taxonomy/taxonomy.service";
import { VenueEntity } from "../venues/venue.entity";

/** Datos demo — Caracas / Miranda (coordenadas aproximadas). */
const SEED_VENUES: Partial<VenueEntity>[] = [
  {
    slug: "oxide-chacao",
    name: "Óxide Functional Chacao",
    description: "Functional training y comunidad.",
    address: "Av. Principal de La Castellana, Caracas",
    zone: "Chacao",
    lat: 10.49785,
    lng: -66.85102,
    venueType: "functional",
    modalities: ["functional", "cross-training"],
    amenities: ["parking", "showers", "wifi"],
    priceMin: 45,
    priceMax: 95,
    completenessScore: 0.82,
    popularityScore: 0.78,
    verificationStatus: "floit_verified",
    allowsTrial: true,
  },
  {
    slug: "arena-baruta",
    name: "Arena Fitness Baruta",
    description: "Gimnasio tradicional + área funcional.",
    address: "Calle Real de La Trinidad, Baruta",
    zone: "Baruta",
    lat: 10.43422,
    lng: -66.87647,
    venueType: "gym",
    modalities: ["gym-floor", "functional"],
    amenities: ["parking", "lockers"],
    priceMin: 35,
    priceMax: 75,
    completenessScore: 0.76,
    popularityScore: 0.62,
    verificationStatus: "partner_verified",
    allowsTrial: true,
  },
  {
    slug: "zen-hatillo",
    name: "Zen Studio Hatillo",
    description: "Yoga y pilates en ambiente boutique.",
    address: "El Hatillo pueblo",
    zone: "El Hatillo",
    lat: 10.42414,
    lng: -66.82169,
    venueType: "yoga",
    modalities: ["yoga", "pilates"],
    amenities: ["showers"],
    priceMin: 40,
    priceMax: 110,
    completenessScore: 0.88,
    popularityScore: 0.71,
    verificationStatus: "floit_verified",
    allowsTrial: true,
  },
  {
    slug: "metropolitan-libertador",
    name: "Metropolitan Gym",
    description: "Alta rotación y horario extendido.",
    address: "Av. Libertador, sector Bello Monte",
    zone: "Libertador",
    lat: 10.48839,
    lng: -66.87389,
    venueType: "gym",
    modalities: ["gym-floor", "cycling"],
    amenities: ["parking", "wifi", "showers"],
    priceMin: 30,
    priceMax: 65,
    completenessScore: 0.71,
    popularityScore: 0.85,
    verificationStatus: "reference",
    allowsTrial: true,
  },
  {
    slug: "las-mercedes-cross",
    name: "Las Mercedes Cross Box",
    description: "Box de cross-training y lifting.",
    address: "Zona Las Mercedes",
    zone: "Chacao",
    lat: 10.48112,
    lng: -66.86109,
    venueType: "functional",
    modalities: ["cross-training", "weightlifting"],
    amenities: ["showers"],
    priceMin: 50,
    priceMax: 120,
    completenessScore: 0.79,
    popularityScore: 0.69,
    verificationStatus: "partner_verified",
    allowsTrial: true,
  },
  {
    slug: "ride-miranda",
    name: "Ride Cycling Studio",
    description: "Indoor cycling y cardio guiado.",
    address: "Los Ruices",
    zone: "Sucre",
    lat: 10.49533,
    lng: -66.82104,
    venueType: "cycling",
    modalities: ["cycling"],
    amenities: ["wifi", "showers"],
    priceMin: 42,
    priceMax: 90,
    completenessScore: 0.74,
    popularityScore: 0.58,
    verificationStatus: "reference",
    allowsTrial: true,
  },
  {
    slug: "forma-personal",
    name: "Forma Personal Training",
    description: "Entrenamiento personalizado y nutrición.",
    address: "Altamira",
    zone: "Chacao",
    lat: 10.50502,
    lng: -66.84841,
    venueType: "personal_training",
    modalities: ["personal-training", "functional"],
    amenities: ["wifi"],
    priceMin: 80,
    priceMax: 200,
    completenessScore: 0.69,
    popularityScore: 0.55,
    verificationStatus: "partner_verified",
    allowsTrial: false,
  },
  {
    slug: "balance-pilates",
    name: "Balance Pilates Lab",
    description: "Reformer y mat pilates.",
    address: "La Castellana",
    zone: "Chacao",
    lat: 10.50041,
    lng: -66.85377,
    venueType: "pilates",
    modalities: ["pilates"],
    amenities: ["wifi"],
    priceMin: 55,
    priceMax: 130,
    completenessScore: 0.81,
    popularityScore: 0.66,
    verificationStatus: "floit_verified",
    allowsTrial: true,
  },
];

/** Demo US-3.2 — algunos venues con canal directo (no todos, para CA “ocultar si no existe”). */
const DEMO_CONTACTS: Record<
  string,
  Partial<
    Pick<VenueEntity, "contactPhone" | "contactWhatsapp" | "contactEmail">
  >
> = {
  "oxide-chacao": {
    contactPhone: "+582125551001",
    contactWhatsapp: "584121111001",
    contactEmail: "hola@oxide-demo.floit.local",
  },
  "arena-baruta": {
    contactPhone: "+582125551002",
    contactWhatsapp: "584121111002",
  },
  "zen-hatillo": {
    contactEmail: "info@zen-demo.floit.local",
  },
  "metropolitan-libertador": {
    contactPhone: "+582125551004",
    contactWhatsapp: "584121111004",
  },
};

const DEMO_PHOTO_URLS: Record<string, string[]> = {
  "oxide-chacao": ["/api/demo-images/oxide-1", "/api/demo-images/oxide-2"],
  "arena-baruta": ["/api/demo-images/arena-1", "/api/demo-images/arena-2"],
  "zen-hatillo": ["/api/demo-images/zen-1", "/api/demo-images/zen-2"],
  "metropolitan-libertador": [
    "/api/demo-images/metropolitan-1",
    "/api/demo-images/metropolitan-2",
  ],
  "las-mercedes-cross": [
    "/api/demo-images/las-mercedes-1",
    "/api/demo-images/las-mercedes-2",
  ],
  "ride-miranda": ["/api/demo-images/ride-1", "/api/demo-images/ride-2"],
  "forma-personal": ["/api/demo-images/forma-1", "/api/demo-images/forma-2"],
  "balance-pilates": [
    "/api/demo-images/balance-1",
    "/api/demo-images/balance-2",
  ],
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(VenueEntity)
    private readonly venues: Repository<VenueEntity>,
    @InjectRepository(PromotionEntity)
    private readonly promotions: Repository<PromotionEntity>,
    private readonly config: ConfigService,
    private readonly taxonomy: TaxonomyService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>("SEED_ON_BOOT") !== "true") return;

    const venueCount = await this.venues.count();
    if (venueCount === 0) {
      const rows = SEED_VENUES.map((v) =>
        this.venues.create({
          ...v,
          ...(v.slug ? DEMO_CONTACTS[v.slug] ?? {} : {}),
          ...(v.slug ? { photoUrls: DEMO_PHOTO_URLS[v.slug] ?? [] } : {}),
        }),
      );
      const saved = await this.venues.save(rows);
      this.log.log(`Seeded ${saved.length} demo venues`);
      await this.seedPromotions(saved);
      await this.syncTaxonomyFromVenues();
      return;
    }

    this.log.log(`Seed venues skipped (${venueCount} exist)`);
    const existing = await this.venues.find();
    await this.backfillDemoPhotoUrls(existing);
    await this.seedPromotionsIfEmpty(existing);
    await this.syncTaxonomyFromVenues();
  }

  private async syncTaxonomyFromVenues(): Promise<void> {
    try {
      const { inserted } = await this.taxonomy.syncMissingSlugsFromVenues();
      if (inserted > 0) {
        this.log.log(`Synced ${inserted} taxonomy rows from venue modalities/amenities`);
      }
    } catch (err) {
      this.log.warn(
        `Taxonomy sync skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async backfillDemoPhotoUrls(venues: VenueEntity[]): Promise<void> {
    const updates = venues.filter((venue) => {
      const next = DEMO_PHOTO_URLS[venue.slug];
      if (!next || next.length === 0) return false;
      const current = venue.photoUrls ?? [];
      return current.length === 0;
    });
    if (updates.length === 0) return;
    for (const venue of updates) {
      venue.photoUrls = DEMO_PHOTO_URLS[venue.slug] ?? [];
    }
    await this.venues.save(updates);
    this.log.log(`Backfilled photoUrls for ${updates.length} demo venues`);
  }

  private async seedPromotionsIfEmpty(vs: VenueEntity[]): Promise<void> {
    const n = await this.promotions.count();
    if (n > 0 || vs.length === 0) return;
    await this.seedPromotions(vs);
  }

  private async seedPromotions(venues: VenueEntity[]): Promise<void> {
    const bySlug = Object.fromEntries(venues.map((v) => [v.slug, v]));
    const defs = [
      {
        slug: "oxide-chacao",
        title: "2×1 primera mensualidad",
        conditions: "Sujeto a disponibilidad (demo Floit)",
        days: 45,
      },
      {
        slug: "zen-hatillo",
        title: "Clase de prueba sin costo",
        conditions: "Agenda con recepción (demo Floit)",
        days: 90,
      },
      {
        slug: "balance-pilates",
        title: "10% mat pilates marzo",
        conditions: "Pagos referenciales (demo Floit)",
        days: 31,
      },
    ];
    const now = Date.now();
    const rows: PromotionEntity[] = [];
    for (const d of defs) {
      const v = bySlug[d.slug];
      if (!v) continue;
      rows.push(
        this.promotions.create({
          venueId: v.id,
          title: d.title,
          conditions: d.conditions,
          startsAt: new Date(now - 86400000),
          endsAt: new Date(now + d.days * 86400000),
        }),
      );
    }
    if (rows.length === 0) return;
    await this.promotions.save(rows);
    this.log.log(`Seeded ${rows.length} demo promotions`);
  }
}

import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Repository } from "typeorm";
import { GeoCityEntity, GeoStateEntity, GeoZoneEntity } from "./geo.entities";

type GeoFile = {
  version: number;
  states: Array<{
    code: string;
    slug: string;
    name: string;
    capital?: string | null;
  }>;
  cities: Array<{
    id: string;
    stateCode: string;
    stateSlug: string;
    slug: string;
    name: string;
    capital?: string | null;
  }>;
  zones: Array<{
    id: string;
    cityId: string;
    slug: string;
    name: string;
    kind?: string;
    featured?: boolean;
    aliases?: string[];
  }>;
};

export type GeoZoneResolved = {
  stateCode: string;
  stateSlug: string;
  stateName: string;
  cityId: string;
  citySlug: string;
  cityName: string;
  zoneId: string;
  zoneSlug: string;
  zoneName: string;
};

@Injectable()
export class GeoService implements OnModuleInit {
  private readonly log = new Logger(GeoService.name);

  constructor(
    @InjectRepository(GeoStateEntity)
    private readonly states: Repository<GeoStateEntity>,
    @InjectRepository(GeoCityEntity)
    private readonly cities: Repository<GeoCityEntity>,
    @InjectRepository(GeoZoneEntity)
    private readonly zones: Repository<GeoZoneEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeeded();
  }

  async ensureSeeded(): Promise<{ states: number; cities: number; zones: number }> {
    const count = await this.states.count();
    if (count > 0) {
      return {
        states: count,
        cities: await this.cities.count(),
        zones: await this.zones.count(),
      };
    }
    const data = this.loadGeoFile();
    if (!data) {
      this.log.warn("Geo seed skipped: venezuela-geo.json not found");
      return { states: 0, cities: 0, zones: 0 };
    }
    await this.states.save(
      data.states.map((s, i) =>
        this.states.create({
          code: s.code,
          slug: s.slug,
          name: s.name,
          capital: s.capital ?? null,
          sortOrder: i,
        }),
      ),
    );
    // batch insert cities/zones
    const cityRows = data.cities.map((c) =>
      this.cities.create({
        id: c.id,
        stateCode: c.stateCode,
        slug: c.slug,
        name: c.name,
        capital: c.capital ?? null,
      }),
    );
    for (let i = 0; i < cityRows.length; i += 100) {
      await this.cities.save(cityRows.slice(i, i + 100));
    }
    const zoneRows = data.zones.map((z) =>
      this.zones.create({
        id: z.id,
        cityId: z.cityId,
        slug: z.slug,
        name: z.name,
        kind: z.kind ?? "parroquia",
        featured: Boolean(z.featured),
        aliases: z.aliases?.length ? z.aliases : null,
      }),
    );
    for (let i = 0; i < zoneRows.length; i += 100) {
      await this.zones.save(zoneRows.slice(i, i + 100));
    }
    this.log.log(
      `Seeded geo VE: ${data.states.length} states, ${data.cities.length} cities, ${data.zones.length} zones`,
    );
    return {
      states: data.states.length,
      cities: data.cities.length,
      zones: data.zones.length,
    };
  }

  async listStates() {
    const rows = await this.states.find({ order: { sortOrder: "ASC", name: "ASC" } });
    return rows.map((r) => ({
      code: r.code,
      slug: r.slug,
      name: r.name,
      capital: r.capital,
    }));
  }

  async listCities(state?: string) {
    const qb = this.cities.createQueryBuilder("c").orderBy("c.name", "ASC");
    if (state?.trim()) {
      const st = await this.resolveState(state.trim());
      if (st) {
        qb.where("c.stateCode = :code", { code: st.code });
      } else {
        qb.where("c.stateCode = :s OR c.stateCode ILIKE :s", { s: state.trim() });
      }
    }
    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      stateCode: r.stateCode,
      slug: r.slug,
      name: r.name,
      capital: r.capital,
    }));
  }

  async listZones(opts: { cityId?: string; state?: string; featured?: boolean } = {}) {
    const qb = this.zones.createQueryBuilder("z").orderBy("z.name", "ASC");
    if (opts.featured) {
      qb.andWhere("z.featured = true");
    }
    if (opts.cityId?.trim()) {
      qb.andWhere("z.cityId = :cityId", { cityId: opts.cityId.trim() });
    } else if (opts.state?.trim()) {
      const st = await this.resolveState(opts.state.trim());
      if (st) {
        qb.innerJoin(GeoCityEntity, "c", "c.id = z.cityId").andWhere(
          "c.stateCode = :code",
          { code: st.code },
        );
      }
    }
    const rows = await qb.getMany();
    return rows.map((r) => ({
      id: r.id,
      cityId: r.cityId,
      slug: r.slug,
      name: r.name,
      kind: r.kind,
      featured: r.featured,
      aliases: r.aliases ?? [],
    }));
  }

  /** Legacy flat list of zone display names (featured + distinct venue-compatible labels). */
  async listZoneLabels(): Promise<string[]> {
    const featured = await this.zones.find({
      where: { featured: true },
      order: { name: "ASC" },
    });
    if (featured.length > 0) {
      return featured.map((z) => z.name);
    }
    const rows = await this.zones.find({
      take: 40,
      order: { name: "ASC" },
    });
    return rows.map((z) => z.name);
  }

  async resolveState(raw: string): Promise<GeoStateEntity | null> {
    const s = raw.trim();
    if (!s) return null;
    return this.states
      .createQueryBuilder("st")
      .where(
        "st.code = :s OR UPPER(st.code) = UPPER(:s) OR st.slug = :slug OR LOWER(st.name) = LOWER(:s)",
        { s, slug: s.toLowerCase() },
      )
      .getOne();
  }

  async resolveCity(raw: string, stateCode?: string): Promise<GeoCityEntity | null> {
    const s = raw.trim();
    if (!s) return null;
    const qb = this.cities
      .createQueryBuilder("c")
      .where("(c.id = :s OR c.slug = :slug OR LOWER(c.name) = LOWER(:n))", {
        s,
        slug: s.toLowerCase(),
        n: s,
      });
    if (stateCode) qb.andWhere("c.stateCode = :stateCode", { stateCode });
    return qb.getOne();
  }

  async resolveZoneRef(raw: string, cityId?: string): Promise<GeoZoneResolved | null> {
    const s = raw.trim();
    if (!s) return null;
    const qb = this.zones
      .createQueryBuilder("z")
      .where(
        "(z.id = :s OR z.slug = :slug OR LOWER(z.name) = LOWER(:n))",
        { s, slug: s.toLowerCase(), n: s },
      );
    if (cityId) qb.andWhere("z.cityId = :cityId", { cityId });
    let zone = await qb.getOne();
    if (!zone) {
      // alias match (simple scan limited)
      const candidates = await this.zones
        .createQueryBuilder("z")
        .where(cityId ? "z.cityId = :cityId" : "1=1", { cityId })
        .getMany();
      const needle = s.toLowerCase();
      zone =
        candidates.find((z) =>
          (z.aliases ?? []).some((a) => a.toLowerCase() === needle || needle.includes(a.toLowerCase())),
        ) ?? null;
    }
    if (!zone) return null;
    const city = await this.cities.findOne({ where: { id: zone.cityId } });
    if (!city) return null;
    const state = await this.states.findOne({ where: { code: city.stateCode } });
    if (!state) return null;
    return {
      stateCode: state.code,
      stateSlug: state.slug,
      stateName: state.name,
      cityId: city.id,
      citySlug: city.slug,
      cityName: city.name,
      zoneId: zone.id,
      zoneSlug: zone.slug,
      zoneName: zone.name,
    };
  }

  async getZoneById(zoneId: string): Promise<GeoZoneResolved | null> {
    return this.resolveZoneRef(zoneId);
  }

  private loadGeoFile(): GeoFile | null {
    const candidates = [
          join(process.cwd(), "data/venezuela-geo.json"),
          join(process.cwd(), "data/geo/ve/venezuela-geo.json"),
          join(process.cwd(), "../../data/geo/ve/venezuela-geo.json"),
          join(__dirname, "../../data/venezuela-geo.json"),
          join(__dirname, "../../../../data/geo/ve/venezuela-geo.json"),
        ];
    for (const p of candidates) {
      if (!existsSync(p)) continue;
      try {
        return JSON.parse(readFileSync(p, "utf8")) as GeoFile;
      } catch (e) {
        this.log.warn(`Failed reading geo file ${p}: ${e}`);
      }
    }
    return null;
  }
}

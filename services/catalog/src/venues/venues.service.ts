import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CreateVenueReportDto } from "../reports/create-report.dto";
import { PromotionEntity } from "../promotions/promotion.entity";
import { VenueReportEntity } from "../reports/venue-report.entity";
import type { UpdatePartnerSyncDto } from "./dto/update-partner-sync.dto";
import type { ListVenuesQueryDto } from "./dto/list-venues.query";
import { VenueEntity } from "./venue.entity";

export type VenueSummary = {
  id: string;
  slug: string;
  name: string;
  address: string;
  zone: string;
  lat: number;
  lng: number;
  venueType: string;
  modalities: string[];
  amenities: string[];
  priceMin: number | null;
  priceMax: number | null;
  completenessScore: number | null;
  popularityScore: number;
  verificationStatus: string;
  allowsTrial: boolean;
  activePromotionTitle?: string;
  distanceM?: number;
};

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(VenueEntity)
    private readonly venues: Repository<VenueEntity>,
    @InjectRepository(PromotionEntity)
    private readonly promotions: Repository<PromotionEntity>,
    @InjectRepository(VenueReportEntity)
    private readonly reports: Repository<VenueReportEntity>,
  ) {}

  async findBySlug(slug: string): Promise<VenueEntity | null> {
    return this.venues.findOne({ where: { slug } });
  }

  async listZones(): Promise<string[]> {
    const rows = (await this.venues.query(
      `SELECT DISTINCT zone FROM venues ORDER BY zone ASC`,
    )) as { zone: string }[];
    return rows.map((r) => r.zone);
  }

  async findPublicDetail(slug: string): Promise<{
    venue: VenueEntity;
    activePromotionTitle?: string;
  } | null> {
    const venue = await this.findBySlug(slug);
    if (!venue) return null;
    const title = await this.promotionTitleForVenueId(venue.id);
    return { venue, ...(title ? { activePromotionTitle: title } : {}) };
  }

  async findAll(query: ListVenuesQueryDto): Promise<{
    items: VenueSummary[];
    meta: {
      total: number;
      sort: string | undefined;
      lat: number | undefined;
      lng: number | undefined;
      radius_km: number | undefined;
    };
  }> {
    const qb = this.venues.createQueryBuilder("v");

    if (query.q?.trim()) {
      qb.andWhere("(v.name ILIKE :q OR v.zone ILIKE :q OR v.address ILIKE :q)", {
        q: `%${query.q.trim()}%`,
      });
    }

    if (query.zone?.trim()) {
      qb.andWhere("v.zone ILIKE :zoneExact", {
        zoneExact: query.zone.trim(),
      });
    }

    if (query.venue_type?.trim()) {
      qb.andWhere("v.venueType = :vt", { vt: query.venue_type.trim() });
    }

    if (query.modality?.trim()) {
      qb.andWhere(":mod = ANY(v.modalities)", { mod: query.modality.trim() });
    }

    if (query.budget_min != null) {
      qb.andWhere("(v.priceMax IS NULL OR v.priceMax >= :bmin)", {
        bmin: query.budget_min,
      });
    }

    if (query.budget_max != null) {
      qb.andWhere("(v.priceMin IS NULL OR v.priceMin <= :bmax)", {
        bmax: query.budget_max,
      });
    }

    const lat = query.lat;
    const lng = query.lng;
    const hasGeo =
      lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

    const distanceExpr = `(6371000 * acos(least(1::float8, greatest(-1::float8,
      cos(radians(:lat)) * cos(radians(v.lat)) *
      cos(radians(v.lng) - radians(:lng)) +
      sin(radians(:lat)) * sin(radians(v.lat))
    ))))`;

    if (hasGeo) {
      qb.setParameters({ lat, lng });
      const radiusM = (query.radius_km ?? 12) * 1000;
      qb.andWhere(`${distanceExpr} <= :radiusM`, { radiusM });
    }

    const sort = query.sort ?? "relevance";

    if (sort === "distance" && hasGeo) {
      qb.orderBy(distanceExpr, "ASC");
    } else if (sort === "price_asc") {
      qb.orderBy("v.priceMin", "ASC", "NULLS LAST");
    } else if (sort === "price_desc") {
      qb.orderBy("v.priceMax", "DESC", "NULLS LAST");
    } else if (sort === "popularity") {
      qb.orderBy("v.popularityScore", "DESC");
    } else if (sort === "name") {
      qb.orderBy("v.name", "ASC");
    }
    /** relevance: orden en memoria tras aplicar filtros */

    const entities = await qb.getMany();

    const promoMap = await this.loadActivePromotionTitles(
      entities.map((e) => e.id),
    );

    let ranked: { v: VenueEntity; distanceM?: number }[] = entities.map(
      (v) => ({
        v,
        distanceM:
          hasGeo && lat != null && lng != null
            ? haversineMeters(lat, lng, v.lat, v.lng)
            : undefined,
      }),
    );

    if (sort === "relevance") {
      ranked.sort(
        (a, b) =>
          relevanceScore(b.v, query, b.distanceM) -
          relevanceScore(a.v, query, a.distanceM),
      );
    }

    const items: VenueSummary[] = ranked.map(({ v, distanceM }) =>
      this.toSummary(v, distanceM, promoMap.get(v.id)),
    );

    return {
      items,
      meta: {
        total: items.length,
        sort,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radius_km: query.radius_km ?? (hasGeo ? 12 : undefined),
      },
    };
  }

  async createReport(slug: string, dto: CreateVenueReportDto): Promise<void> {
    const venue = await this.findBySlug(slug);
    if (!venue) throw new NotFoundException("Venue not found");
    await this.reports.save(
      this.reports.create({
        venueSlug: slug,
        kind: dto.kind,
        message: dto.message,
      }),
    );
  }

  async applyPartnerSync(slug: string, dto: UpdatePartnerSyncDto): Promise<void> {
    const venue = await this.findBySlug(slug);
    if (!venue) throw new NotFoundException("Venue not found");
    if (dto.description !== undefined) {
      const lines: string[] = [];
      if (dto.description.trim()) lines.push(dto.description.trim());
      if (Array.isArray(dto.plans) && dto.plans.length > 0) {
        const planLines = dto.plans
          .filter((p) => p.active !== false)
          .map((p) =>
            [
              p.name?.trim(),
              p.period?.trim(),
              p.priceLabel?.trim(),
              p.description?.trim(),
            ]
              .filter(Boolean)
              .join(" · "),
          )
          .filter(Boolean);
        if (planLines.length > 0) {
          lines.push("Planes:");
          lines.push(...planLines.map((x) => `- ${x}`));
        }
      }
      venue.description = lines.join("\n").trim() || null;
    }
    if (dto.contactPhone !== undefined) venue.contactPhone = dto.contactPhone.trim() || null;
    if (dto.contactWhatsapp !== undefined) {
      venue.contactWhatsapp = dto.contactWhatsapp.trim() || null;
    }
    if (dto.contactEmail !== undefined) {
      venue.contactEmail = dto.contactEmail.trim().toLowerCase() || null;
    }
    if (dto.allowsTrial !== undefined) venue.allowsTrial = dto.allowsTrial;
    if (venue.verificationStatus === "reference") {
      venue.verificationStatus = "partner_verified";
    }
    await this.venues.save(venue);
  }

  async findDuplicateSuspects(): Promise<
    { a: string; b: string; reason: string }[]
  > {
    const all = await this.venues.find();
    const out: { a: string; b: string; reason: string }[] = [];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const x = all[i];
        const y = all[j];
        if (x.zone !== y.zone) continue;
        const dx = levenshtein(normName(x.name), normName(y.name));
        if (dx > 0 && dx <= 4) {
          out.push({
            a: x.slug,
            b: y.slug,
            reason: "Nombre parecido en la misma zona",
          });
        }
      }
    }
    return out;
  }

  private async promotionTitleForVenueId(
    venueId: string,
  ): Promise<string | undefined> {
    const now = new Date();
    const rows = await this.promotions
      .createQueryBuilder("p")
      .where("p.venueId = :id", { id: venueId })
      .andWhere("p.startsAt <= :now", { now })
      .andWhere("p.endsAt >= :now", { now })
      .orderBy("p.endsAt", "DESC")
      .getMany();
    return rows[0]?.title;
  }

  private async loadActivePromotionTitles(
    venueIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (venueIds.length === 0) return map;
    const now = new Date();
    const rows = await this.promotions
      .createQueryBuilder("p")
      .where("p.venueId IN (:...ids)", { ids: venueIds })
      .andWhere("p.startsAt <= :now", { now })
      .andWhere("p.endsAt >= :now", { now })
      .orderBy("p.endsAt", "DESC")
      .getMany();
    for (const p of rows) {
      if (!map.has(p.venueId)) map.set(p.venueId, p.title);
    }
    return map;
  }

  private toSummary(
    v: VenueEntity,
    distanceM: number | undefined,
    promotionTitle: string | undefined,
  ): VenueSummary {
    return {
      id: v.id,
      slug: v.slug,
      name: v.name,
      address: v.address,
      zone: v.zone,
      lat: v.lat,
      lng: v.lng,
      venueType: v.venueType,
      modalities: v.modalities ?? [],
      amenities: v.amenities ?? [],
      priceMin: v.priceMin,
      priceMax: v.priceMax,
      completenessScore: v.completenessScore,
      popularityScore: v.popularityScore ?? 0.5,
      verificationStatus: v.verificationStatus ?? "reference",
      allowsTrial: v.allowsTrial ?? true,
      ...(promotionTitle ? { activePromotionTitle: promotionTitle } : {}),
      ...(distanceM !== undefined ? { distanceM } : {}),
    };
  }
}

function relevanceScore(
  v: VenueEntity,
  query: ListVenuesQueryDto,
  distanceM?: number,
): number {
  let s = (v.completenessScore ?? 0) * 38;
  s += (v.popularityScore ?? 0.5) * 24;
  if (distanceM !== undefined) {
    s += Math.max(0, 30 - Math.min(distanceM / 450, 30));
  }
  const q = query.q?.trim().toLowerCase();
  if (q) {
    if (v.name.toLowerCase().includes(q)) s += 14;
    if (v.zone.toLowerCase().includes(q)) s += 8;
    if (v.address.toLowerCase().includes(q)) s += 5;
  }
  if ((v.completenessScore ?? 0) < 0.55) s -= 10;
  return s;
}

/** Distancia sobre esfera (metros). */
export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + cost,
      );
    }
  }
  return dp[m]![n]!;
}

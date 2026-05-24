import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VenueEntity } from "../venues/venue.entity";
import type { TaxonomyKind } from "./taxonomy-attribute.entity";
import { TaxonomyAttributeEntity } from "./taxonomy-attribute.entity";
import type { CreateTaxonomyAttributeDto } from "./dto/create-taxonomy-attribute.dto";
import type { UpdateTaxonomyAttributeDto } from "./dto/update-taxonomy-attribute.dto";

export type TaxonomyAttributeDto = {
  slug: string;
  label: string;
  kind: TaxonomyKind;
  icon: string | null;
  active: boolean;
  sortOrder: number;
  gymCount: number;
  updatedAt: string;
};

@Injectable()
export class TaxonomyService {
  constructor(
    @InjectRepository(TaxonomyAttributeEntity)
    private readonly taxonomy: Repository<TaxonomyAttributeEntity>,
    @InjectRepository(VenueEntity)
    private readonly venues: Repository<VenueEntity>,
  ) {}

  async listActive(kind?: TaxonomyKind): Promise<TaxonomyAttributeDto[]> {
    const rows = await this.taxonomy.find({
      where: {
        active: true,
        ...(kind ? { kind } : {}),
      },
      order: { sortOrder: "ASC", label: "ASC" },
    });
    const items: TaxonomyAttributeDto[] = [];
    for (const row of rows) {
      const gymCount = await this.countVenueRefs(row.kind, row.slug);
      items.push(this.toDto(row, gymCount));
    }
    return items;
  }

  async list(): Promise<TaxonomyAttributeDto[]> {
    const rows = await this.taxonomy.find({
      order: { sortOrder: "ASC", label: "ASC" },
    });
    const items: TaxonomyAttributeDto[] = [];
    for (const row of rows) {
      const gymCount = await this.countVenueRefs(row.kind, row.slug);
      items.push(this.toDto(row, gymCount));
    }
    return items;
  }

  async create(dto: CreateTaxonomyAttributeDto): Promise<TaxonomyAttributeDto> {
    const slug = dto.slug.trim().toLowerCase();
    const exists = await this.taxonomy.findOne({ where: { slug } });
    if (exists) {
      throw new ConflictException("taxonomy_slug_exists");
    }
    const row = this.taxonomy.create({
      slug,
      label: dto.label.trim(),
      kind: dto.kind,
      icon: dto.icon?.trim() ? dto.icon.trim() : null,
      active: true,
      sortOrder: 0,
    });
    const saved = await this.taxonomy.save(row);
    const gymCount = await this.countVenueRefs(saved.kind, saved.slug);
    return this.toDto(saved, gymCount);
  }

  async update(
    slugRaw: string,
    dto: UpdateTaxonomyAttributeDto,
  ): Promise<TaxonomyAttributeDto> {
    const slug = slugRaw.trim().toLowerCase();
    const row = await this.taxonomy.findOne({ where: { slug } });
    if (!row) {
      throw new NotFoundException("taxonomy_not_found");
    }
    if (dto.label !== undefined) row.label = dto.label.trim();
    if (dto.icon !== undefined) {
      row.icon =
        dto.icon === null || String(dto.icon).trim() === ""
          ? null
          : String(dto.icon).trim();
    }
    if (dto.active !== undefined) row.active = dto.active;
    const saved = await this.taxonomy.save(row);
    const gymCount = await this.countVenueRefs(saved.kind, saved.slug);
    return this.toDto(saved, gymCount);
  }

  /**
   * Inserta filas para slugs presentes en venues que aún no están en taxonomía.
   * Modalidades primero; si un slug ya existe, no se crea segunda fila (slug único).
   */
  async syncMissingSlugsFromVenues(): Promise<{ inserted: number }> {
    const venues = await this.venues.find();
    const modalitySlugs = new Set<string>();
    const amenitySlugs = new Set<string>();
    for (const v of venues) {
      for (const m of v.modalities ?? []) {
        if (m?.trim()) modalitySlugs.add(m.trim().toLowerCase());
      }
      for (const a of v.amenities ?? []) {
        if (a?.trim()) amenitySlugs.add(a.trim().toLowerCase());
      }
    }

    const existingRows = await this.taxonomy.find();
    const bySlug = new Map(existingRows.map((r) => [r.slug, r]));

    let inserted = 0;
    for (const slug of modalitySlugs) {
      if (bySlug.has(slug)) continue;
      const saved = await this.taxonomy.save(
        this.taxonomy.create({
          slug,
          label: slugToLabel(slug),
          kind: "modality",
          active: true,
          icon: null,
          sortOrder: 0,
        }),
      );
      bySlug.set(slug, saved);
      inserted += 1;
    }
    for (const slug of amenitySlugs) {
      if (bySlug.has(slug)) continue;
      const saved = await this.taxonomy.save(
        this.taxonomy.create({
          slug,
          label: slugToLabel(slug),
          kind: "amenity",
          active: true,
          icon: null,
          sortOrder: 0,
        }),
      );
      bySlug.set(slug, saved);
      inserted += 1;
    }

    return { inserted };
  }

  private async countVenueRefs(
    kind: TaxonomyKind,
    slug: string,
  ): Promise<number> {
    const qb = this.venues.createQueryBuilder("v");
    if (kind === "modality") {
      qb.where(":slug = ANY(v.modalities)", { slug });
    } else {
      qb.where(":slug = ANY(v.amenities)", { slug });
    }
    return qb.getCount();
  }

  private toDto(
    row: TaxonomyAttributeEntity,
    gymCount: number,
  ): TaxonomyAttributeDto {
    return {
      slug: row.slug,
      label: row.label,
      kind: row.kind,
      icon: row.icon,
      active: row.active,
      sortOrder: row.sortOrder,
      gymCount,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

function slugToLabel(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

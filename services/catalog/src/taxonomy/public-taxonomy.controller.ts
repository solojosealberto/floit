import { Controller, Get, Query } from "@nestjs/common";
import type { TaxonomyKind } from "./taxonomy-attribute.entity";
import { TaxonomyService } from "./taxonomy.service";

@Controller("v1/meta/taxonomy-attributes")
export class PublicTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get()
  async list(@Query("kind") kind?: string) {
    const normalized =
      kind === "modality" || kind === "amenity" ? (kind as TaxonomyKind) : undefined;
    const items = await this.taxonomy.listActive(normalized);
    return { items };
  }
}

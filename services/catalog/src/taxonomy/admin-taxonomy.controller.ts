import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AdminApiGuard } from "../admin-api.guard";
import { CreateTaxonomyAttributeDto } from "./dto/create-taxonomy-attribute.dto";
import { UpdateTaxonomyAttributeDto } from "./dto/update-taxonomy-attribute.dto";
import { TaxonomyService } from "./taxonomy.service";

@Controller("v1/admin/taxonomy-attributes")
@UseGuards(AdminApiGuard)
export class AdminTaxonomyController {
  constructor(private readonly taxonomy: TaxonomyService) {}

  @Get()
  async list() {
    const items = await this.taxonomy.list();
    return { items };
  }

  @Post()
  async create(@Body() dto: CreateTaxonomyAttributeDto) {
    const row = await this.taxonomy.create(dto);
    return row;
  }

  /** Importa slugs de modalities/amenities de venues que aún no están en taxonomía. */
  @Post("sync-from-venues")
  async syncFromVenues() {
    const { inserted } = await this.taxonomy.syncMissingSlugsFromVenues();
    const items = await this.taxonomy.list();
    return { inserted, items };
  }

  @Patch(":slug")
  async update(
    @Param("slug") slug: string,
    @Body() dto: UpdateTaxonomyAttributeDto,
  ) {
    const row = await this.taxonomy.update(slug, dto);
    return row;
  }

  @Delete(":slug")
  @HttpCode(204)
  async remove(@Param("slug") slug: string) {
    await this.taxonomy.remove(slug);
  }
}

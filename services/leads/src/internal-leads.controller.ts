import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { InternalApiGuard } from "./internal-api.guard";
import { UpdateInternalLeadStatusDto } from "./dto/update-internal-lead-status.dto";
import { LeadsService } from "./leads.service";

@Controller()
@UseGuards(InternalApiGuard)
export class InternalLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get("v1/internal/leads/by-venues")
  async listByVenues(
    @Query("venues") venuesRaw?: string,
    @Query("limit") limitRaw?: string,
  ) {
    const venues = String(venuesRaw ?? "")
      .split(",")
      .map((it) => it.trim())
      .filter(Boolean);
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const rows = await this.leads.listByVenues(venues, limit);
    return {
      items: rows.map((r) => ({
        id: r.id,
        venueSlug: r.venueSlug,
        intent: r.intent,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  @Get("v1/internal/leads/:id")
  async getById(@Param("id") id: string) {
    const row = await this.leads.findById(id);
    if (!row) throw new NotFoundException("lead_not_found");
    return {
      id: row.id,
      venueSlug: row.venueSlug,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      firstContactedAt: row.firstContactedAt
        ? row.firstContactedAt.toISOString()
        : null,
    };
  }

  @Patch("v1/internal/leads/:id/status")
  async patchStatus(
    @Param("id") id: string,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: UpdateInternalLeadStatusDto,
  ) {
    const result = await this.leads.updateStatusById(id, body.status);
    if (!result.ok) throw new NotFoundException("lead_not_found");
    return result;
  }
}

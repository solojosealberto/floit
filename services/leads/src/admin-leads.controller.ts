import {
  Controller,
  Get,
  Header,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
import { AdminApiGuard } from "./admin-api.guard";
import { LeadsService } from "./leads.service";
import { NotificationDispatcherService } from "./notification-dispatcher.service";

@Controller()
@UseGuards(AdminApiGuard)
export class AdminLeadsController {
  constructor(
    private readonly leads: LeadsService,
    private readonly notifications: NotificationDispatcherService,
  ) {}

  @Get("v1/admin/leads/export.csv")
  @Header(
    "Content-Disposition",
    'attachment; filename="floit-leads.csv"',
  )
  async exportCsv(
    @Query("limit") limitRaw: string | undefined,
    @Res() res: Response,
  ) {
    const n = Number.parseInt(limitRaw ?? "500", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 500;
    const csv = await this.leads.exportCsv(limit);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.send(csv);
  }

  @Get("v1/admin/leads")
  async list(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "200", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 200;
    const rows = await this.leads.listRecent(limit);
    return {
      items: rows.map((r) => ({
        id: r.id,
        venueSlug: r.venueSlug,
        intent: r.intent,
        name: r.name,
        phone: r.phone,
        email: r.email,
        status: r.status,
        suspicious: r.suspicious,
        clientIp: r.clientIp,
        consentVersion: r.consentVersion,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }

  @Get("v1/admin/notifications/failures")
  async listFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "100", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 100;
    return {
      items: await this.notifications.listFailures(limit),
    };
  }

  @Post("v1/admin/notifications/retry")
  async retryFailures(@Query("limit") limitRaw?: string) {
    const n = Number.parseInt(limitRaw ?? "50", 10);
    const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 500) : 50;
    return this.notifications.retryFailures(limit);
  }

  @Get("v1/admin/leads/sla-summary")
  async slaSummary(
    @Query("windowHours") windowHoursRaw?: string,
    @Query("targetMinutes") targetMinutesRaw?: string,
  ) {
    const windowHours = Number.parseInt(windowHoursRaw ?? "168", 10);
    const targetMinutes = Number.parseInt(targetMinutesRaw ?? "120", 10);
    return this.leads.getSlaSummary(
      Number.isFinite(windowHours) ? windowHours : 168,
      Number.isFinite(targetMinutes) ? targetMinutes : 120,
    );
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  ValidationPipe,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { MoreThan, Repository } from "typeorm";
import { AnalyticsEventEntity } from "./analytics-event.entity";
import { IngestEventDto } from "./dto/ingest-event.dto";

type StoredEvent = {
  at: string;
  name: string;
  properties?: Record<string, unknown>;
  device: "mobile" | "tablet" | "desktop" | "bot" | "unknown";
  source: string | null;
};

@Controller()
export class EventsController {
  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly events: Repository<AnalyticsEventEntity>,
  ) {}

  @Post("v1/events")
  @HttpCode(202)
  async ingest(
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    body: IngestEventDto,
    @Req() req: Request,
  ) {
    const properties: Record<string, unknown> = { ...(body.properties ?? {}) };
    let createdAt: Date | undefined;
    if (process.env.ANALYTICS_ALLOW_BACKDATE === "true") {
      const daysAgo = Number(properties._stagingBackdateDays);
      if (Number.isFinite(daysAgo) && daysAgo >= 0 && daysAgo <= 30) {
        createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        delete properties._stagingBackdateDays;
      }
    }
    const sourceFromProperties =
      typeof properties.source === "string"
        ? properties.source.trim()
        : "";
    const sourceFromReferer = this.extractSourcePath(
      String(req.headers.referer ?? ""),
    );
    const row = this.events.create({
      name: body.name,
      properties: Object.keys(properties).length > 0 ? properties : null,
      device: this.detectDevice(String(req.headers["user-agent"] ?? "")),
      source: sourceFromProperties || sourceFromReferer || null,
    });
    if (createdAt) {
      row.createdAt = createdAt;
    }
    await this.events.save(row);
    await this.trimToMaxItems(50000);
    return { ok: true };
  }

  @Get("v1/metrics/summary")
  async summary() {
    const events = await this.events.count();
    const lastRow = await this.events.find({
      order: { createdAt: "DESC" },
      take: 1,
    });
    return {
      events,
      last: lastRow[0] ? this.toStoredEvent(lastRow[0]) : null,
    };
  }

  @Get("v1/metrics/funnel")
  async funnel(
    @Query("windowHours") windowHoursRaw?: string,
    @Query("device") deviceRaw?: string,
  ) {
    const windowHours = this.parseWindowHours(windowHoursRaw);
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);
    const deviceFilter = this.parseDeviceFilter(deviceRaw);
    let eventRows = await this.events.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: "ASC" },
    });
    if (deviceFilter) {
      eventRows = eventRows.filter((e) => e.device === deviceFilter);
    }
    const rows = eventRows.map((event) => this.toStoredEvent(event));

    const byName = new Map<string, number>();
    const zones = new Map<string, number>();
    const sources = new Map<string, number>();
    const devices = new Map<string, number>();
    const venues = new Map<string, number>();
    const leadSubmitsByVenue = new Map<string, number>();
    const venueViewsByVenue = new Map<string, number>();
    const ctaExperiment = new Map<
      string,
      { variant: string; assignments: number; ctaClicks: number; leadSubmits: number }
    >();
    for (const row of rows) {
      byName.set(row.name, (byName.get(row.name) ?? 0) + 1);
      devices.set(row.device, (devices.get(row.device) ?? 0) + 1);
      if (row.source) {
        sources.set(row.source, (sources.get(row.source) ?? 0) + 1);
      }
      const zone = this.readStringProperty(row, "zone");
      if (zone) zones.set(zone, (zones.get(zone) ?? 0) + 1);

      const venueSlug =
        this.readStringProperty(row, "venueSlug") ??
        this.readStringProperty(row, "slug");
      if (venueSlug) venues.set(venueSlug, (venues.get(venueSlug) ?? 0) + 1);
      if (row.name === "lead_submit") {
        const ls =
          this.readStringProperty(row, "venueSlug") ??
          this.readStringProperty(row, "slug");
        if (ls) {
          leadSubmitsByVenue.set(ls, (leadSubmitsByVenue.get(ls) ?? 0) + 1);
        }
      }
      if (row.name === "venue_view") {
        const vs = this.readStringProperty(row, "slug");
        if (vs) {
          venueViewsByVenue.set(vs, (venueViewsByVenue.get(vs) ?? 0) + 1);
        }
      }

      const experiment = this.readStringProperty(row, "experiment");
      const ctaVariant = this.readStringProperty(row, "ctaVariant");
      if (experiment === "cta_lead_entrypoint_v2" && ctaVariant) {
        const existing = ctaExperiment.get(ctaVariant) ?? {
          variant: ctaVariant,
          assignments: 0,
          ctaClicks: 0,
          leadSubmits: 0,
        };
        if (row.name === "experiment_assignment") existing.assignments += 1;
        if (row.name === "cta_click") existing.ctaClicks += 1;
        if (row.name === "lead_submit") existing.leadSubmits += 1;
        ctaExperiment.set(ctaVariant, existing);
      }
    }

    const discoveryViews = byName.get("discovery_view") ?? 0;
    const venueViews = byName.get("venue_view") ?? 0;
    const compareOpens = byName.get("compare_open") ?? 0;
    const leadSubmits = byName.get("lead_submit") ?? 0;
    const directContacts = byName.get("direct_contact_click") ?? 0;
    const ctaClicks = byName.get("cta_click") ?? leadSubmits + directContacts;
    const leadPersisted = byName.get("lead_persisted") ?? 0;

    return {
      windowHours,
      device: deviceFilter ?? "all",
      events: rows.length,
      last: rows.at(-1) ?? null,
      byName: this.mapToSortedEntries(byName).map(([name, count]) => ({
        name,
        count,
      })),
      funnel: {
        discoveryViews,
        filterApplies: byName.get("filter_apply") ?? 0,
        venueViews,
        compareOpens,
        ctaClicks,
        leadSubmits,
        directContacts,
        leadPersisted,
      },
      rates: {
        searchToProfileRate: this.safeRate(venueViews, discoveryViews),
        compareAdoptionRate: this.safeRate(compareOpens, discoveryViews),
        profileToLeadSubmitRate: this.safeRate(leadSubmits, venueViews),
        profileToCtaRate: this.safeRate(ctaClicks, venueViews),
      },
      segments: {
        zones: this.mapToSortedEntries(zones).map(([zone, count]) => ({
          zone,
          count,
        })),
        devices: this.mapToSortedEntries(devices).map(([device, count]) => ({
          device,
          count,
        })),
        sources: this.mapToSortedEntries(sources)
          .slice(0, 12)
          .map(([source, count]) => ({ source, count })),
      },
      topVenues: this.mapToSortedEntries(venues)
        .slice(0, 12)
        .map(([venueSlug, count]) => ({ venueSlug, count })),
      venuesLeadPerformance: this.mapToSortedEntries(leadSubmitsByVenue)
        .slice(0, 5)
        .map(([venueSlug, leads]) => {
          const views = venueViewsByVenue.get(venueSlug) ?? 0;
          return {
            venueSlug,
            leads,
            venueViews: views,
            convRate: this.safeRate(leads, views),
          };
        }),
      experiments: {
        ctaLeadForm: [...ctaExperiment.values()]
          .map((row) => ({
            ...row,
            submitRateFromAssignments: this.safeRate(
              row.leadSubmits,
              row.assignments,
            ),
            submitRateFromClicks: this.safeRate(row.leadSubmits, row.ctaClicks),
          }))
          .sort((a, b) => b.leadSubmits - a.leadSubmits),
      },
    };
  }

  @Get("v1/metrics/timeseries")
  async timeseries(
    @Query("windowDays") windowDaysRaw?: string,
    @Query("device") deviceRaw?: string,
  ) {
    const windowDays = this.parseWindowDays(windowDaysRaw);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const deviceFilter = this.parseDeviceFilter(deviceRaw);
    let rows = await this.events.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: "ASC" },
    });
    if (deviceFilter) {
      rows = rows.filter((e) => e.device === deviceFilter);
    }
    const points = new Map<
      string,
      {
        date: string;
        discoveryViews: number;
        venueViews: number;
        compareOpens: number;
        ctaClicks: number;
        leadSubmits: number;
        leadPersisted: number;
      }
    >();
    for (const row of rows) {
      const date = row.createdAt.toISOString().slice(0, 10);
      const existing = points.get(date) ?? {
        date,
        discoveryViews: 0,
        venueViews: 0,
        compareOpens: 0,
        ctaClicks: 0,
        leadSubmits: 0,
        leadPersisted: 0,
      };
      switch (row.name) {
        case "discovery_view":
          existing.discoveryViews += 1;
          break;
        case "venue_view":
          existing.venueViews += 1;
          break;
        case "compare_open":
          existing.compareOpens += 1;
          break;
        case "cta_click":
          existing.ctaClicks += 1;
          break;
        case "lead_submit":
          existing.leadSubmits += 1;
          break;
        case "lead_persisted":
          existing.leadPersisted += 1;
          break;
        default:
          break;
      }
      points.set(date, existing);
    }

    return {
      windowDays,
      device: deviceFilter ?? "all",
      points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  @Get("v1/metrics/experiments/cta-lead-form")
  async ctaLeadFormExperiment(@Query("windowDays") windowDaysRaw?: string) {
    const windowDays = this.parseWindowDays(windowDaysRaw);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const rows = await this.events.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: "ASC" },
    });

    type VariantName = "membership" | "trial" | "whatsapp_first";
    const variantNames: VariantName[] = [
      "membership",
      "trial",
      "whatsapp_first",
    ];
    type DailyVariant = {
      date: string;
      membership: { assignments: number; leadSubmits: number };
      trial: { assignments: number; leadSubmits: number };
      whatsapp_first: { assignments: number; leadSubmits: number };
    };
    const daily = new Map<string, DailyVariant>();
    const totals = new Map<VariantName, { assignments: number; leadSubmits: number }>([
      ["membership", { assignments: 0, leadSubmits: 0 }],
      ["trial", { assignments: 0, leadSubmits: 0 }],
      ["whatsapp_first", { assignments: 0, leadSubmits: 0 }],
    ]);

    for (const row of rows) {
      const props =
        typeof row.properties === "object" && row.properties
          ? (row.properties as Record<string, unknown>)
          : null;
      const experiment =
        props && typeof props.experiment === "string"
          ? props.experiment.trim()
          : "";
      const variantRaw =
        props && typeof props.ctaVariant === "string"
          ? props.ctaVariant.trim()
          : "";
      const variant = variantNames.includes(variantRaw as VariantName)
        ? (variantRaw as VariantName)
        : null;
      if (experiment !== "cta_lead_entrypoint_v2" || !variant) continue;

      const date = row.createdAt.toISOString().slice(0, 10);
      const point = daily.get(date) ?? {
        date,
        membership: { assignments: 0, leadSubmits: 0 },
        trial: { assignments: 0, leadSubmits: 0 },
        whatsapp_first: { assignments: 0, leadSubmits: 0 },
      };
      if (row.name === "experiment_assignment") {
        point[variant].assignments += 1;
        totals.get(variant)!.assignments += 1;
      } else if (row.name === "lead_submit") {
        point[variant].leadSubmits += 1;
        totals.get(variant)!.leadSubmits += 1;
      }
      daily.set(date, point);
    }

    const membership = totals.get("membership")!;
    const trial = totals.get("trial")!;
    const membershipRate = this.safeRate(
      membership.leadSubmits,
      membership.assignments,
    );
    const trialRate = this.safeRate(trial.leadSubmits, trial.assignments);
    const whatsapp = totals.get("whatsapp_first")!;
    const whatsappRate = this.safeRate(
      whatsapp.leadSubmits,
      whatsapp.assignments,
    );
    const upliftTrialVsMembership = Number((trialRate - membershipRate).toFixed(4));
    const upliftWhatsappVsMembership = Number(
      (whatsappRate - membershipRate).toFixed(4),
    );

    const points = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
    const stableDaysWithBothVariants = points.filter(
      (point) =>
        point.membership.assignments > 0 && point.trial.assignments > 0,
    ).length;
    const stableDaysWithAllVariants = points.filter(
      (point) =>
        point.membership.assignments > 0 &&
        point.trial.assignments > 0 &&
        point.whatsapp_first.assignments > 0,
    ).length;

    return {
      experiment: "cta_lead_entrypoint_v2",
      windowDays,
      stableDaysWithBothVariants,
      stableDaysWithAllVariants,
      summary: {
        membership: {
          assignments: membership.assignments,
          leadSubmits: membership.leadSubmits,
          submitRateFromAssignments: membershipRate,
        },
        trial: {
          assignments: trial.assignments,
          leadSubmits: trial.leadSubmits,
          submitRateFromAssignments: trialRate,
        },
        whatsapp_first: {
          assignments: whatsapp.assignments,
          leadSubmits: whatsapp.leadSubmits,
          submitRateFromAssignments: whatsappRate,
        },
        upliftTrialVsMembership,
        upliftWhatsappVsMembership,
      },
      points,
    };
  }

  /** Filtra por `device` almacenado en el evento (`mobile` | `tablet` | `desktop`). */
  private parseDeviceFilter(
    raw?: string,
  ): "mobile" | "tablet" | "desktop" | undefined {
    const s = raw?.trim().toLowerCase();
    if (!s || s === "all") return undefined;
    if (s === "mobile" || s === "tablet" || s === "desktop") return s;
    return undefined;
  }

  private parseWindowDays(raw?: string): number {
    const parsed = Number(raw ?? "14");
    if (!Number.isFinite(parsed)) return 14;
    return Math.max(1, Math.min(90, Math.floor(parsed)));
  }

  private toStoredEvent(event: AnalyticsEventEntity): StoredEvent {
    return {
      at: event.createdAt.toISOString(),
      name: event.name,
      properties: event.properties ?? undefined,
      device: event.device,
      source: event.source,
    };
  }

  private async trimToMaxItems(maxItems: number): Promise<void> {
    const total = await this.events.count();
    if (total <= maxItems) return;
    const surplus = total - maxItems;
    const oldRows = await this.events.find({
      order: { createdAt: "ASC" },
      take: surplus,
    });
    if (oldRows.length > 0) {
      await this.events.remove(oldRows);
    }
  }

  private parseWindowHours(raw?: string): number {
    const parsed = Number(raw ?? "168");
    if (!Number.isFinite(parsed)) return 168;
    return Math.max(1, Math.min(24 * 30, Math.floor(parsed)));
  }

  private mapToSortedEntries(map: Map<string, number>): [string, number][] {
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }

  private safeRate(value: number, total: number): number {
    if (total <= 0) return 0;
    return Number((value / total).toFixed(4));
  }

  private readStringProperty(
    row: StoredEvent,
    key: string,
  ): string | null {
    const value = row.properties?.[key];
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private detectDevice(
    userAgent: string,
  ): "mobile" | "tablet" | "desktop" | "bot" | "unknown" {
    const ua = userAgent.toLowerCase();
    if (!ua) return "unknown";
    if (/bot|crawler|spider|headless/.test(ua)) return "bot";
    if (/tablet|ipad/.test(ua)) return "tablet";
    if (/mobile|android|iphone/.test(ua)) return "mobile";
    return "desktop";
  }

  private extractSourcePath(referer: string): string | null {
    if (!referer) return null;
    try {
      const parsed = new URL(referer);
      const path = `${parsed.pathname}${parsed.search}`.trim();
      return path || null;
    } catch {
      return null;
    }
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";
import { MoreThan, Repository } from "typeorm";
import type { CreateLeadDto } from "./dto/create-lead.dto";
import type { PatchAdminLeadDto } from "./dto/patch-admin-lead.dto";
import { LeadEntity } from "./lead.entity";
import { NotificationDispatcherService } from "./notification-dispatcher.service";

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leads: Repository<LeadEntity>,
    private readonly config: ConfigService,
    private readonly notifier: NotificationDispatcherService,
  ) {}

  async create(
    dto: CreateLeadDto,
    ctx: {
      clientIp?: string;
      clientUserAgent?: string | null;
    } = {},
  ): Promise<{
    id: string;
    publicToken: string;
    status: string;
  }> {
    const publicToken = randomUUID();
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const ip = ctx.clientIp?.trim() || null;
    let recentFromIp = 0;
    if (ip) {
      recentFromIp = await this.leads.count({
        where: { clientIp: ip, createdAt: MoreThan(since) },
      });
    }
    const suspicious = ip != null && recentFromIp >= 8;
    const entryChannel: "form" | "whatsapp" = dto.entryChannel ?? "form";
    const ua = ctx.clientUserAgent?.trim() || null;
    const clientUserAgent = ua ? ua.slice(0, 2048) : null;

    const row = this.leads.create({
      venueSlug: dto.venueSlug,
      intent: dto.intent,
      name: dto.name,
      phone: dto.phone,
      email: dto.email ?? null,
      preferredSlot: dto.preferredSlot ?? null,
      message: dto.message ?? null,
      consentAccepted: dto.consentAccepted,
      consentVersion: dto.consentVersion ?? null,
      status: "received",
      firstContactedAt: null,
      publicToken,
      clientIp: ip,
      suspicious,
      entryChannel,
      clientUserAgent,
    });
    const saved = await this.leads.save(row);
    this.emitLeadPersistedEvent(saved);
    await this.notifier.enqueueLeadReceived(saved);
    return {
      id: saved.id,
      publicToken: saved.publicToken,
      status: saved.status,
    };
  }

  /** Duplica señal de negocio hacia analytics (sin bloquear respuesta al usuario). */
  private emitLeadPersistedEvent(row: LeadEntity): void {
    const base = this.config.get<string>("ANALYTICS_SERVICE_URL")?.trim();
    if (!base) return;
    const url = `${base.replace(/\/$/, "")}/v1/events`;
    const body = JSON.stringify({
      name: "lead_persisted",
      properties: {
        leadId: row.id,
        venueSlug: row.venueSlug,
        intent: row.intent,
        suspicious: row.suspicious,
      },
    });
    void fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    }).catch(() => {});
  }

  async exportCsv(limit = 500): Promise<string> {
    const rows = await this.listRecent(limit);
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header =
      "id,venueSlug,intent,name,phone,email,status,suspicious,entryChannel,clientIp,clientUserAgent,consentVersion,createdAt";
    const lines = rows.map((r) =>
      [
        r.id,
        r.venueSlug,
        r.intent,
        r.name,
        r.phone,
        r.email ?? "",
        r.status,
        r.suspicious,
        r.entryChannel ?? "form",
        r.clientIp ?? "",
        (r.clientUserAgent ?? "").replace(/\r?\n/g, " "),
        r.consentVersion ?? "",
        r.createdAt.toISOString(),
      ]
        .map(esc)
        .join(","),
    );
    return "\ufeff" + header + "\n" + lines.join("\n");
  }

  async listRecent(limit = 200): Promise<LeadEntity[]> {
    return this.leads.find({
      order: { createdAt: "DESC" },
      take: Math.min(limit, 500),
    });
  }

  async listByVenues(venues: string[], limit = 200): Promise<LeadEntity[]> {
    const uniq = Array.from(new Set(venues.map((v) => v.trim()).filter(Boolean)));
    if (uniq.length === 0) return [];
    const rows = await this.leads.find({
      where: uniq.map((venueSlug) => ({ venueSlug })),
      order: { createdAt: "DESC" },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return rows;
  }

  async findById(id: string): Promise<LeadEntity | null> {
    return this.leads.findOne({ where: { id } });
  }

  async updateStatusById(
    id: string,
    status: "contacted" | "closed",
  ): Promise<
    | { ok: true; id: string; status: "received" | "contacted" | "closed"; venueSlug: string; firstContactedAt: string | null }
    | { ok: false; reason: "not_found" }
  > {
    const row = await this.leads.findOne({ where: { id } });
    if (!row) return { ok: false, reason: "not_found" };
    row.status = status;
    if (!row.firstContactedAt && (status === "contacted" || status === "closed")) {
      row.firstContactedAt = new Date();
    }
    const saved = await this.leads.save(row);
    return {
      ok: true,
      id: saved.id,
      status: saved.status,
      venueSlug: saved.venueSlug,
      firstContactedAt: saved.firstContactedAt
        ? saved.firstContactedAt.toISOString()
        : null,
    };
  }

  async getDailyLeadsByChannel(windowHours = 168): Promise<{
    windowHours: number;
    points: { date: string; form: number; whatsapp: number }[];
  }> {
    const safeWindow = Math.max(1, Math.min(24 * 30, Math.floor(windowHours)));
    const since = new Date(Date.now() - safeWindow * 60 * 60 * 1000);
    const rows = await this.leads.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: "ASC" },
    });
    const byDay = new Map<string, { form: number; whatsapp: number }>();
    for (const r of rows) {
      const date = r.createdAt.toISOString().slice(0, 10);
      const cur = byDay.get(date) ?? { form: 0, whatsapp: 0 };
      if (r.entryChannel === "whatsapp") cur.whatsapp += 1;
      else cur.form += 1;
      byDay.set(date, cur);
    }
    const points = [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        date,
        form: v.form,
        whatsapp: v.whatsapp,
      }));
    return { windowHours: safeWindow, points };
  }

  async getSlaSummary(windowHours = 168, targetMinutes = 120): Promise<{
    windowHours: number;
    targetMinutes: number;
    totalLeads: number;
    contactedLeads: number;
    contactedWithinTarget: number;
    partnerSlaRate: number;
    averageFirstResponseMinutes: number | null;
  }> {
    const safeWindow = Math.max(1, Math.min(24 * 30, Math.floor(windowHours)));
    const safeTarget = Math.max(1, Math.min(24 * 60, Math.floor(targetMinutes)));
    const since = new Date(Date.now() - safeWindow * 60 * 60 * 1000);
    const rows = await this.leads.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: "DESC" },
      take: 5000,
    });

    const totalLeads = rows.length;
    let contactedLeads = 0;
    let contactedWithinTarget = 0;
    let totalResponseMinutes = 0;
    for (const row of rows) {
      if (!row.firstContactedAt) continue;
      contactedLeads += 1;
      const deltaMs = row.firstContactedAt.getTime() - row.createdAt.getTime();
      const minutes = Math.max(0, Math.floor(deltaMs / 60000));
      totalResponseMinutes += minutes;
      if (minutes <= safeTarget) contactedWithinTarget += 1;
    }

    return {
      windowHours: safeWindow,
      targetMinutes: safeTarget,
      totalLeads,
      contactedLeads,
      contactedWithinTarget,
      partnerSlaRate:
        totalLeads > 0
          ? Number((contactedWithinTarget / totalLeads).toFixed(4))
          : 0,
      averageFirstResponseMinutes:
        contactedLeads > 0
          ? Number((totalResponseMinutes / contactedLeads).toFixed(2))
          : null,
    };
  }

  async statusByToken(token: string): Promise<{
    status: string;
    intent: string;
    venueSlug: string;
    createdAt: string;
  }> {
    const row = await this.leads.findOne({ where: { publicToken: token } });
    if (!row) throw new NotFoundException("Lead not found");
    return {
      status: row.status,
      intent: row.intent,
      venueSlug: row.venueSlug,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async getAdminDetail(id: string): Promise<{
    lead: Record<string, unknown>;
    traceability: {
      sameIpTodayCount: number;
      samePhoneAllTimeCount: number;
      dwellTimeSeconds: null;
      fieldsSummary: string;
    };
    notificationEnqueuedAt: string | null;
  } | null> {
    const row = await this.findById(id);
    if (!row) return null;
    const sameIpTodayCount = await this.countLeadsSameIpToday(row.clientIp);
    const samePhoneAllTimeCount = await this.countLeadsSamePhoneAllTime(row.phone);
    const notificationEnqueuedAt =
      await this.notifier.getNotificationEnqueueIsoForLeadId(row.id);
    return {
      lead: this.serializeLeadAdmin(row),
      traceability: {
        sameIpTodayCount,
        samePhoneAllTimeCount,
        dwellTimeSeconds: null,
        fieldsSummary: this.fieldsCompletionSummary(row),
      },
      notificationEnqueuedAt,
    };
  }

  async patchAdminLead(
    id: string,
    patch: PatchAdminLeadDto,
  ): Promise<LeadEntity | null> {
    const row = await this.findById(id);
    if (!row) return null;
    if (patch.status !== undefined) {
      row.status = patch.status;
      if (
        !row.firstContactedAt &&
        (patch.status === "contacted" || patch.status === "closed")
      ) {
        row.firstContactedAt = new Date();
      }
    }
    if (patch.suspicious !== undefined) row.suspicious = patch.suspicious;
    if (patch.adminNote !== undefined) {
      const t = patch.adminNote?.trim();
      row.adminNote = t ? t : null;
    }
    return this.leads.save(row);
  }

  private serializeLeadAdmin(row: LeadEntity): Record<string, unknown> {
    return {
      id: row.id,
      venueSlug: row.venueSlug,
      intent: row.intent,
      name: row.name,
      phone: row.phone,
      email: row.email,
      preferredSlot: row.preferredSlot,
      message: row.message,
      consentAccepted: row.consentAccepted,
      consentVersion: row.consentVersion,
      status: row.status,
      suspicious: row.suspicious,
      clientIp: row.clientIp,
      entryChannel: row.entryChannel ?? "form",
      clientUserAgent: row.clientUserAgent,
      adminNote: row.adminNote,
      firstContactedAt: row.firstContactedAt
        ? row.firstContactedAt.toISOString()
        : null,
      publicToken: row.publicToken,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private normalizePhoneDigits(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private async countLeadsSameIpToday(ip: string | null): Promise<number> {
    if (!ip?.trim()) return 0;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.leads
      .createQueryBuilder("l")
      .where("l.clientIp = :ip", { ip })
      .andWhere("l.createdAt >= :start", { start })
      .getCount();
  }

  private async countLeadsSamePhoneAllTime(phone: string): Promise<number> {
    const target = this.normalizePhoneDigits(phone);
    if (target.length < 6) return 0;
    const rows = await this.leads.find({ select: ["phone"] });
    return rows.filter((r) => this.normalizePhoneDigits(r.phone) === target)
      .length;
  }

  private fieldsCompletionSummary(row: LeadEntity): string {
    const parts: string[] = ["Nombre", "Teléfono"];
    if (row.email?.trim()) parts.push("Email");
    if (row.message?.trim()) parts.push("comentario");
    if (row.preferredSlot?.trim()) parts.push("horario preferido");
    return parts.join(" · ");
  }
}

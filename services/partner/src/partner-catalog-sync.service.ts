import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { PartnerCatalogSyncJobEntity } from "./partner-catalog-sync-job.entity";

@Injectable()
export class PartnerCatalogSyncService {
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(PartnerCatalogSyncJobEntity)
    private readonly jobs: Repository<PartnerCatalogSyncJobEntity>,
    private readonly config: ConfigService,
  ) {}

  async enqueue(partnerEmail: string, venueSlug: string, payload: unknown): Promise<void> {
    const token = this.config.get<string>("PARTNER_TO_CATALOG_INTERNAL_TOKEN")?.trim();
    if (!token) return;
    await this.jobs.save(
      this.jobs.create({
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
        partnerEmail,
        venueSlug,
        payload: JSON.stringify(payload),
      }),
    );
    this.schedule(0);
  }

  async listFailures(limit = 100) {
    const rows = await this.jobs.find({
      where: { status: "failed" },
      order: { createdAt: "DESC" },
      take: Math.max(1, Math.min(limit, 500)),
    });
    return rows.map((r) => ({
      id: r.id,
      partnerEmail: r.partnerEmail,
      venueSlug: r.venueSlug,
      attempts: r.attempts,
      lastError: r.lastError,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async retryFailures(limit = 50): Promise<{ requeued: number; remaining: number }> {
    const rows = await this.jobs.find({
      where: { status: "failed" },
      order: { createdAt: "DESC" },
      take: Math.max(1, Math.min(limit, 500)),
    });
    const now = new Date();
    for (const row of rows) {
      row.status = "pending";
      row.attempts = 0;
      row.lastError = null;
      row.nextAttemptAt = now;
    }
    if (rows.length > 0) await this.jobs.save(rows);
    const remaining = await this.jobs.count({ where: { status: "failed" } });
    if (rows.length > 0) this.schedule(0);
    return { requeued: rows.length, remaining };
  }

  async getQueueStats(): Promise<{ pending: number; failed: number; sent: number }> {
    const [pending, failed, sent] = await Promise.all([
      this.jobs.count({ where: { status: "pending" } }),
      this.jobs.count({ where: { status: "failed" } }),
      this.jobs.count({ where: { status: "sent" } }),
    ]);
    return { pending, failed, sent };
  }

  schedule(ms: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.processQueue();
    }, Math.max(ms, 0));
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (true) {
        const row = await this.jobs.findOne({
          where: { status: "pending", nextAttemptAt: LessThanOrEqual(new Date()) },
          order: { nextAttemptAt: "ASC" },
        });
        if (!row) break;

        const ok = await this.trySend(row);
        if (ok) {
          row.status = "sent";
          row.lastError = null;
          await this.jobs.save(row);
          continue;
        }

        const nextAttempts = row.attempts + 1;
        if (nextAttempts >= this.maxAttempts()) {
          row.status = "failed";
          row.attempts = nextAttempts;
          await this.jobs.save(row);
        } else {
          row.status = "pending";
          row.attempts = nextAttempts;
          row.nextAttemptAt = new Date(Date.now() + this.retryDelayMs(nextAttempts));
          await this.jobs.save(row);
        }
      }
      await this.trimDlq();
    } finally {
      this.processing = false;
      const next = await this.jobs.findOne({
        where: { status: "pending" },
        order: { nextAttemptAt: "ASC" },
      });
      if (next) {
        this.schedule(Math.max(0, next.nextAttemptAt.getTime() - Date.now()));
      }
    }
  }

  private async trySend(row: PartnerCatalogSyncJobEntity): Promise<boolean> {
    const base = this.config.get<string>("CATALOG_SERVICE_URL") ?? "http://localhost:4010";
    const token = this.config.get<string>("PARTNER_TO_CATALOG_INTERNAL_TOKEN")?.trim();
    if (!token) return true;
    try {
      const payload = JSON.parse(row.payload);
      const res = await fetch(
        `${base.replace(/\/$/, "")}/v1/internal/venues/${encodeURIComponent(row.venueSlug)}/partner-sync`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-internal-token": token,
          },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) return true;
      row.lastError = `HTTP ${res.status}`;
      return false;
    } catch (e) {
      row.lastError = e instanceof Error ? e.message : "sync_error";
      return false;
    }
  }

  private maxAttempts(): number {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_SYNC_MAX_ATTEMPTS") ?? "4",
      10,
    );
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 10) : 4;
  }

  private retryDelayMs(attempt: number): number {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_SYNC_BASE_DELAY_MS") ?? "1000",
      10,
    );
    const base = Number.isFinite(raw) ? Math.min(Math.max(raw, 100), 30000) : 1000;
    return base * 2 ** Math.max(0, attempt - 1);
  }

  private async trimDlq(): Promise<void> {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_SYNC_DLQ_MAX_ITEMS") ?? "200",
      10,
    );
    const cap = Number.isFinite(raw) ? Math.min(Math.max(raw, 20), 2000) : 200;
    const count = await this.jobs.count({ where: { status: "failed" } });
    if (count <= cap) return;
    const overflow = count - cap;
    const rows = await this.jobs.find({
      where: { status: "failed" },
      order: { createdAt: "ASC" },
      take: overflow,
    });
    if (rows.length > 0) await this.jobs.remove(rows);
  }
}

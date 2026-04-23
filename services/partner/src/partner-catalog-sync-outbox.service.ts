import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import { PartnerCatalogSyncOutboxEntity } from "./partner-catalog-sync-outbox.entity";
import { PartnerCatalogSyncService } from "./partner-catalog-sync.service";

@Injectable()
export class PartnerCatalogSyncOutboxService {
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(PartnerCatalogSyncOutboxEntity)
    private readonly outbox: Repository<PartnerCatalogSyncOutboxEntity>,
    private readonly config: ConfigService,
    private readonly syncQueue: PartnerCatalogSyncService,
  ) {}

  async enqueueRequestedEvent(
    partnerEmail: string,
    venueSlug: string,
    payload: unknown,
  ): Promise<void> {
    await this.outbox.save(
      this.outbox.create({
        eventType: "partner.catalog.sync.requested",
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
        partnerEmail,
        venueSlug,
        payload: JSON.stringify(payload),
        publishedAt: null,
      }),
    );
    this.schedule(0);
  }

  async listFailures(limit = 100) {
    const rows = await this.outbox.find({
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
    const rows = await this.outbox.find({
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
      row.publishedAt = null;
    }
    if (rows.length > 0) await this.outbox.save(rows);
    const remaining = await this.outbox.count({ where: { status: "failed" } });
    if (rows.length > 0) this.schedule(0);
    return { requeued: rows.length, remaining };
  }

  async getQueueStats(): Promise<{ pending: number; failed: number; published: number }> {
    const [pending, failed, published] = await Promise.all([
      this.outbox.count({ where: { status: "pending" } }),
      this.outbox.count({ where: { status: "failed" } }),
      this.outbox.count({ where: { status: "published" } }),
    ]);
    return { pending, failed, published };
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
        const row = await this.outbox.findOne({
          where: { status: "pending", nextAttemptAt: LessThanOrEqual(new Date()) },
          order: { nextAttemptAt: "ASC" },
        });
        if (!row) break;

        const ok = await this.tryPublish(row);
        if (ok) {
          row.status = "published";
          row.publishedAt = new Date();
          row.lastError = null;
          await this.outbox.save(row);
          continue;
        }

        const nextAttempts = row.attempts + 1;
        if (nextAttempts >= this.maxAttempts()) {
          row.status = "failed";
          row.attempts = nextAttempts;
          await this.outbox.save(row);
        } else {
          row.status = "pending";
          row.attempts = nextAttempts;
          row.nextAttemptAt = new Date(Date.now() + this.retryDelayMs(nextAttempts));
          await this.outbox.save(row);
        }
      }
      await this.trimDlq();
    } finally {
      this.processing = false;
      const next = await this.outbox.findOne({
        where: { status: "pending" },
        order: { nextAttemptAt: "ASC" },
      });
      if (next) {
        this.schedule(Math.max(0, next.nextAttemptAt.getTime() - Date.now()));
      }
    }
  }

  private async tryPublish(row: PartnerCatalogSyncOutboxEntity): Promise<boolean> {
    try {
      const payload = JSON.parse(row.payload);
      await this.syncQueue.enqueue(row.partnerEmail, row.venueSlug, payload);
      return true;
    } catch (e) {
      row.lastError = e instanceof Error ? e.message : "outbox_publish_error";
      return false;
    }
  }

  private maxAttempts(): number {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_OUTBOX_MAX_ATTEMPTS") ?? "6",
      10,
    );
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 20) : 6;
  }

  private retryDelayMs(attempt: number): number {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_OUTBOX_BASE_DELAY_MS") ?? "1000",
      10,
    );
    const base = Number.isFinite(raw) ? Math.min(Math.max(raw, 100), 30000) : 1000;
    return base * 2 ** Math.max(0, attempt - 1);
  }

  private async trimDlq(): Promise<void> {
    const raw = Number.parseInt(
      this.config.get<string>("PARTNER_CATALOG_OUTBOX_DLQ_MAX_ITEMS") ?? "300",
      10,
    );
    const cap = Number.isFinite(raw) ? Math.min(Math.max(raw, 20), 5000) : 300;
    const count = await this.outbox.count({ where: { status: "failed" } });
    if (count <= cap) return;
    const overflow = count - cap;
    const rows = await this.outbox.find({
      where: { status: "failed" },
      order: { createdAt: "ASC" },
      take: overflow,
    });
    if (rows.length > 0) await this.outbox.remove(rows);
  }
}

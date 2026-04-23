import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";
import type { LeadEntity } from "./lead.entity";
import { NotificationDeliveryEntity } from "./notification-delivery.entity";

type NotificationLeadSnapshot = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  preferredSlot: string | null;
  message: string | null;
  suspicious: boolean;
  createdAt: string;
};

type NotificationFailure = {
  id: string;
  failedAt: string;
  attempts: number;
  lastError: string | null;
  lead: NotificationLeadSnapshot;
};

@Injectable()
export class NotificationDispatcherService {
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveries: Repository<NotificationDeliveryEntity>,
    private readonly config: ConfigService,
  ) {}

  async enqueueLeadReceived(leadRow: LeadEntity): Promise<void> {
    if (!this.webhookUrl()) return;
    const row = this.deliveries.create({
      status: "pending",
      attempts: 0,
      nextAttemptAt: new Date(),
      lastError: null,
      payload: JSON.stringify({
        event: "lead_received",
        lead: this.snapshot(leadRow),
      }),
    });
    await this.deliveries.save(row);
    this.schedule(0);
  }

  async listFailures(limit = 100): Promise<NotificationFailure[]> {
    const rows = await this.deliveries.find({
      where: { status: "failed" },
      order: { createdAt: "DESC" },
      take: Math.max(1, Math.min(limit, 500)),
    });
    return rows.map((r) => {
      const payload = this.safeParsePayload(r.payload);
      return {
        id: r.id,
        failedAt: r.nextAttemptAt.toISOString(),
        attempts: r.attempts,
        lastError: r.lastError,
        lead: payload.lead,
      };
    });
  }

  async retryFailures(limit = 50): Promise<{ requeued: number; remaining: number }> {
    const n = Math.max(1, Math.min(limit, 500));
    const failed = await this.deliveries.find({
      where: { status: "failed" },
      order: { createdAt: "DESC" },
      take: n,
    });
    if (failed.length === 0) {
      const remaining = await this.deliveries.count({ where: { status: "failed" } });
      return { requeued: 0, remaining };
    }
    const now = new Date();
    for (const row of failed) {
      row.status = "pending";
      row.attempts = 0;
      row.lastError = null;
      row.nextAttemptAt = now;
    }
    await this.deliveries.save(failed);
    this.schedule(0);
    const remaining = await this.deliveries.count({ where: { status: "failed" } });
    return { requeued: failed.length, remaining };
  }

  private schedule(ms: number): void {
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
        const due = await this.deliveries.findOne({
          where: {
            status: "pending",
            nextAttemptAt: LessThanOrEqual(new Date()),
          },
          order: { nextAttemptAt: "ASC" },
        });
        if (!due) break;

        const ok = await this.trySend(due);
        if (ok) {
          due.status = "sent";
          due.lastError = null;
          await this.deliveries.save(due);
          continue;
        }

        const nextAttempts = due.attempts + 1;
        if (nextAttempts >= this.maxAttempts()) {
          due.status = "failed";
          due.attempts = nextAttempts;
          await this.deliveries.save(due);
        } else {
          due.status = "pending";
          due.attempts = nextAttempts;
          due.nextAttemptAt = new Date(Date.now() + this.retryDelayMs(nextAttempts));
          await this.deliveries.save(due);
        }
      }

      await this.trimDlqIfNeeded();
    } finally {
      this.processing = false;
      const next = await this.deliveries.findOne({
        where: { status: "pending" },
        order: { nextAttemptAt: "ASC" },
      });
      if (next) {
        this.schedule(Math.max(0, next.nextAttemptAt.getTime() - Date.now()));
      }
    }
  }

  private async trySend(row: NotificationDeliveryEntity): Promise<boolean> {
    const webhook = this.webhookUrl();
    if (!webhook) return true;
    const payload = this.safeParsePayload(row.payload);
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          delivery: {
            queueId: row.id,
            attempt: row.attempts + 1,
            maxAttempts: this.maxAttempts(),
          },
        }),
      });
      if (res.ok) return true;
      row.lastError = `HTTP ${res.status}`;
      return false;
    } catch (error) {
      row.lastError = error instanceof Error ? error.message : "network_error";
      return false;
    }
  }

  private async trimDlqIfNeeded(): Promise<void> {
    const cap = this.failureCap();
    const count = await this.deliveries.count({ where: { status: "failed" } });
    if (count <= cap) return;
    const overflow = count - cap;
    const stale = await this.deliveries.find({
      where: { status: "failed" },
      order: { createdAt: "ASC" },
      take: overflow,
    });
    if (stale.length > 0) {
      await this.deliveries.remove(stale);
    }
  }

  private safeParsePayload(payloadRaw: string): {
    event: string;
    lead: NotificationLeadSnapshot;
  } {
    try {
      const parsed = JSON.parse(payloadRaw) as {
        event?: string;
        lead?: NotificationLeadSnapshot;
      };
      if (parsed?.lead && parsed?.event) {
        return {
          event: parsed.event,
          lead: parsed.lead,
        };
      }
    } catch {
      // fallthrough
    }
    return {
      event: "lead_received",
      lead: {
        id: "unknown",
        venueSlug: "unknown",
        intent: "info",
        name: "unknown",
        phone: "unknown",
        email: null,
        preferredSlot: null,
        message: null,
        suspicious: false,
        createdAt: new Date().toISOString(),
      },
    };
  }

  private snapshot(leadRow: LeadEntity): NotificationLeadSnapshot {
    return {
      id: leadRow.id,
      venueSlug: leadRow.venueSlug,
      intent: leadRow.intent,
      name: leadRow.name,
      phone: leadRow.phone,
      email: leadRow.email,
      preferredSlot: leadRow.preferredSlot,
      message: leadRow.message,
      suspicious: leadRow.suspicious,
      createdAt: leadRow.createdAt.toISOString(),
    };
  }

  private webhookUrl(): string | null {
    return this.config.get<string>("LEADS_NOTIFICATION_WEBHOOK_URL")?.trim() || null;
  }

  private maxAttempts(): number {
    const raw = Number.parseInt(
      this.config.get<string>("LEADS_NOTIFICATION_MAX_ATTEMPTS") ?? "4",
      10,
    );
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 10) : 4;
  }

  private retryDelayMs(attempt: number): number {
    const raw = Number.parseInt(
      this.config.get<string>("LEADS_NOTIFICATION_BASE_DELAY_MS") ?? "1000",
      10,
    );
    const base = Number.isFinite(raw) ? Math.min(Math.max(raw, 100), 30000) : 1000;
    return base * 2 ** Math.max(0, attempt - 1);
  }

  private failureCap(): number {
    const raw = Number.parseInt(
      this.config.get<string>("LEADS_NOTIFICATION_DLQ_MAX_ITEMS") ?? "200",
      10,
    );
    return Number.isFinite(raw) ? Math.min(Math.max(raw, 20), 2000) : 200;
  }
}

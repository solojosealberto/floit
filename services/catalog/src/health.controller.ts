import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import type { DataSource } from "typeorm";

@Controller()
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get("health")
  health() {
    return { ok: true, service: "catalog" };
  }

  /** DB + venues table check (staging ops). */
  @Get("health/ready")
  async ready() {
    try {
      const rows = (await this.dataSource.query(
        "SELECT COUNT(*)::int AS count FROM venues",
      )) as { count: number }[];
      const count = Number(rows[0]?.count ?? 0);
      return { ok: true, service: "catalog", venues: count };
    } catch (e) {
      const reason = e instanceof Error ? e.message : "db_error";
      throw new ServiceUnavailableException({
        ok: false,
        service: "catalog",
        reason,
      });
    }
  }
}

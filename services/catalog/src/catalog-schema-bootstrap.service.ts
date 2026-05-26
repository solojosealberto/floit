import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectDataSource } from "@nestjs/typeorm";
import type { DataSource } from "typeorm";

/**
 * One-time schema ensure for staging/prod when DATABASE_SYNC=false but tables are missing.
 * Set CATALOG_ENSURE_SCHEMA=true, deploy once, then unset.
 */
@Injectable()
export class CatalogSchemaBootstrapService implements OnModuleInit {
  private readonly log = new Logger(CatalogSchemaBootstrapService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.get<string>("CATALOG_ENSURE_SCHEMA")?.trim() !== "true") {
      return;
    }
    this.log.warn("CATALOG_ENSURE_SCHEMA=true — running TypeORM synchronize (disable after success)");
    await this.dataSource.synchronize();
    this.log.log("Schema synchronize completed");
  }
}

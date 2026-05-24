import { join } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthController } from "./health.controller";
import { LeadEntity } from "./lead.entity";
import { LeadsModule } from "./leads.module";
import { NotificationDeliveryEntity } from "./notification-delivery.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 12,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const entities = [LeadEntity, NotificationDeliveryEntity];
        const synchronize = config.get<string>("DATABASE_SYNC") !== "false";
        const databaseUrl = config.get<string>("DATABASE_URL")?.trim();
        if (databaseUrl) {
          return {
            type: "postgres" as const,
            url: databaseUrl,
            entities,
            synchronize,
            ssl: databaseUrl.includes("sslmode=require")
              ? { rejectUnauthorized: false }
              : undefined,
          };
        }
        const dbPath =
          config.get<string>("LEADS_SQLITE_PATH") ??
          join(__dirname, "..", "data", "leads.sqlite");
        return {
          type: "sqlite" as const,
          database: dbPath,
          entities,
          synchronize,
        };
      },
    }),
    LeadsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

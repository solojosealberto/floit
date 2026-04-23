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
        const dbPath =
          config.get<string>("LEADS_SQLITE_PATH") ??
          join(__dirname, "..", "data", "leads.sqlite");
        return {
          type: "sqlite" as const,
          database: dbPath,
          entities: [LeadEntity, NotificationDeliveryEntity],
          synchronize: config.get<string>("DATABASE_SYNC") !== "false",
        };
      },
    }),
    LeadsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

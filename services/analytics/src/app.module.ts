import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "node:path";
import { AnalyticsEventEntity } from "./analytics-event.entity";
import { EventsController } from "./events.controller";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbPath =
          config.get<string>("ANALYTICS_SQLITE_PATH") ??
          join(__dirname, "..", "data", "analytics.sqlite");
        return {
          type: "sqlite" as const,
          database: dbPath,
          entities: [AnalyticsEventEntity],
          synchronize: config.get<string>("DATABASE_SYNC") !== "false",
        };
      },
    }),
    TypeOrmModule.forFeature([AnalyticsEventEntity]),
  ],
  controllers: [HealthController, EventsController],
})
export class AppModule {}

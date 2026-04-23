import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { HttpModule } from "@nestjs/axios";
import { HealthController } from "./health.controller";
import { SearchController } from "./search.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL: config.get<string>("CATALOG_SERVICE_URL") ?? "http://localhost:4010",
        timeout: 15_000,
        headers: { "user-agent": "floit-search-service/0.1" },
      }),
    }),
  ],
  controllers: [HealthController, SearchController],
})
export class AppModule {}

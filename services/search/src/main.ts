import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4011);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`search-service listening on http://${host}:${port}`);
}

void bootstrap();

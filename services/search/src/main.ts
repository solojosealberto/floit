import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4011);
  await app.listen(port);
  console.log(`search-service listening on ${port}`);
}

void bootstrap();

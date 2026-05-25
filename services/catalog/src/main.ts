import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({ origin: false });
  const port = Number(process.env.PORT ?? 4010);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`catalog-service listening on http://${host}:${port}`);
}

void bootstrap();

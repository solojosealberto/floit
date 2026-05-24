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
  await app.listen(port);
  console.log(`catalog-service listening on http://localhost:${port}`);
}

void bootstrap();

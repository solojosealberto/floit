import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: false,
      transform: true,
    }),
  );
  app.enableCors({ origin: false });
  const port = Number(process.env.PORT ?? 4014);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`analytics-service listening on http://${host}:${port}`);
}

void bootstrap();

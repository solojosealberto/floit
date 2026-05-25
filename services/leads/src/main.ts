import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  assertAuthConfig();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidUnknownValues: false }),
  );
  app.enableCors({ origin: false });
  const port = Number(process.env.PORT ?? 4012);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`leads-service listening on http://${host}:${port}`);
}

function assertAuthConfig(): void {
  const strictOidc = process.env.ADMIN_AUTH_REQUIRE_OIDC?.trim() === "true";
  const issuer = process.env.ADMIN_OIDC_ISSUER?.trim();
  if (strictOidc && !issuer) {
    throw new Error(
      "ADMIN_AUTH_REQUIRE_OIDC=true requiere ADMIN_OIDC_ISSUER en leads-service.",
    );
  }
}

void bootstrap();

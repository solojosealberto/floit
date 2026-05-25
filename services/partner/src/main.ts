import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { static as serveStatic } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  assertAuthConfig();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors();
  const mediaDir = process.env.PARTNER_MEDIA_DIR?.trim() || join(process.cwd(), "data", "uploads");
  if (!existsSync(mediaDir)) {
    mkdirSync(mediaDir, { recursive: true });
  }
  app.use("/uploads", serveStatic(mediaDir));
  const port = Number(process.env.PORT ?? 4013);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen(port, host);
  console.log(`partner-service listening on http://${host}:${port}`);
}

function assertAuthConfig(): void {
  const strictAdmin = process.env.ADMIN_AUTH_REQUIRE_OIDC?.trim() === "true";
  const strictPartner = process.env.PARTNER_AUTH_REQUIRE_OIDC?.trim() === "true";
  const adminIssuer = process.env.ADMIN_OIDC_ISSUER?.trim();
  const partnerIssuer = process.env.PARTNER_OIDC_ISSUER?.trim();
  if (strictAdmin && !adminIssuer) {
    throw new Error(
      "ADMIN_AUTH_REQUIRE_OIDC=true requiere ADMIN_OIDC_ISSUER en partner-service.",
    );
  }
  if (strictPartner && !partnerIssuer) {
    throw new Error(
      "PARTNER_AUTH_REQUIRE_OIDC=true requiere PARTNER_OIDC_ISSUER en partner-service.",
    );
  }
}

void bootstrap();

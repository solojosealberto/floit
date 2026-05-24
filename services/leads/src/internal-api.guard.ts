import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const configured = this.config.get<string>("LEADS_INTERNAL_API_TOKEN")?.trim();
    const isNonProduction = this.config.get<string>("NODE_ENV")?.trim() !== "production";
    const expected = configured || (isNonProduction ? "change-me-dev-only" : "");
    if (!expected) {
      throw new UnauthorizedException("internal_api_not_configured");
    }
    const req = ctx.switchToHttp().getRequest<Request>();
    const got = String(req.headers["x-internal-token"] ?? "").trim();
    if (got !== expected) {
      throw new UnauthorizedException("invalid_internal_token");
    }
    return true;
  }
}

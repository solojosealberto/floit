import {
  Controller,
  Get,
  InternalServerErrorException,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { HttpService } from "@nestjs/axios";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";

/**
 * Fachada de discovery: delega en Catalog hasta exista índice propio (Meilisearch / proyección).
 */
@Controller()
export class SearchController {
  constructor(private readonly http: HttpService) {}

  private upstreamError(context: string, err: unknown): never {
    if (isAxiosError(err)) {
      const base = err.config?.baseURL ?? "";
      const path = err.config?.url ?? "";
      const status = err.response?.status;
      const detail =
        typeof err.response?.data === "object"
          ? JSON.stringify(err.response.data).slice(0, 200)
          : String(err.response?.data ?? "").slice(0, 200);
      throw new InternalServerErrorException({
        context,
        upstream: `${base}${path}`,
        code: err.code,
        status,
        message: err.message,
        detail: detail || undefined,
      });
    }
    throw new InternalServerErrorException({
      context,
      message: err instanceof Error ? err.message : String(err),
    });
  }

  @Get("v1/search")
  async search(@Req() req: Request) {
    const qs = req.url.includes("?")
      ? req.url.substring(req.url.indexOf("?"))
      : "";
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`/v1/venues${qs}`),
      );
      return data;
    } catch (err) {
      this.upstreamError("v1/search", err);
    }
  }

  @Get("v1/meta/zones")
  async zones() {
    try {
      const { data } = await firstValueFrom(
        this.http.get<unknown>(`/v1/meta/zones`),
      );
      return data;
    } catch (err) {
      this.upstreamError("v1/meta/zones", err);
    }
  }
}

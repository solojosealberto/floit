import { Controller, Get, Req } from "@nestjs/common";
import type { Request } from "express";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

/**
 * Fachada de discovery: delega en Catalog hasta exista índice propio (Meilisearch / proyección).
 */
@Controller()
export class SearchController {
  constructor(private readonly http: HttpService) {}

  @Get("v1/search")
  async search(@Req() req: Request) {
    const qs = req.url.includes("?")
      ? req.url.substring(req.url.indexOf("?"))
      : "";
    const { data } = await firstValueFrom(
      this.http.get<unknown>(`/v1/venues${qs}`),
    );
    return data;
  }

  @Get("v1/meta/zones")
  async zones() {
    const { data } = await firstValueFrom(
      this.http.get<unknown>(`/v1/meta/zones`),
    );
    return data;
  }
}

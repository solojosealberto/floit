import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";

@Controller()
export class HealthController {
  constructor(private readonly http: HttpService) {}

  @Get("health")
  health() {
    return { ok: true, service: "search" };
  }

  /** Verifica que search puede alcanzar catalog (staging ops). */
  @Get("health/ready")
  async ready() {
    try {
      const { data } = await firstValueFrom(
        this.http.get<{ ok?: boolean; venues?: number }>("/health/ready"),
      );
      return { ok: true, service: "search", catalog: data };
    } catch (err) {
      const reason = isAxiosError(err)
        ? `${err.code ?? "axios"} ${err.config?.baseURL ?? ""}${err.config?.url ?? ""} — ${err.message}`
        : err instanceof Error
          ? err.message
          : "catalog_unreachable";
      throw new ServiceUnavailableException({
        ok: false,
        service: "search",
        reason,
      });
    }
  }
}

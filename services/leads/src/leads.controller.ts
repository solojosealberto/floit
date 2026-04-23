import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";
import { clientIpFromRequest } from "./client-ip";
import type { CreateLeadDto } from "./dto/create-lead.dto";
import { LeadsService } from "./leads.service";

@Controller()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Throttle({ default: { limit: 12, ttl: 60_000 } })
  @UseGuards(ThrottlerGuard)
  @Post("v1/leads")
  async create(
    @Req() req: Request,
    @Body(new ValidationPipe({ whitelist: true, transform: true }))
    dto: CreateLeadDto,
  ) {
    return this.leads.create(dto, {
      clientIp: clientIpFromRequest(req),
    });
  }

  @SkipThrottle()
  @Get("v1/leads/status/:token")
  async status(@Param("token") token: string) {
    return this.leads.statusByToken(token);
  }
}

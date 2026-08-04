import { Controller, Get, Query } from "@nestjs/common";
import { GeoService } from "./geo.service";

@Controller("v1/meta/geo")
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get("states")
  async states() {
    const items = await this.geo.listStates();
    return { items };
  }

  @Get("cities")
  async cities(@Query("state") state?: string) {
    const items = await this.geo.listCities(state);
    return { items };
  }

  @Get("zones")
  async zones(
    @Query("cityId") cityId?: string,
    @Query("state") state?: string,
    @Query("featured") featured?: string,
  ) {
    const items = await this.geo.listZones({
      cityId,
      state,
      featured: featured === "1" || featured === "true",
    });
    return { items };
  }
}

import { IsBoolean, IsOptional } from "class-validator";

export class SetCoverPartnerVenuePhotoDto {
  @IsOptional()
  @IsBoolean()
  cover?: boolean;
}

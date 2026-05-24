import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateVenuePartnerPlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  period?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  priceLabel?: string;
}

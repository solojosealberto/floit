import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class PartnerClaimNewVenueDraftDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  businessName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  zone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(48)
  venueType!: string;

  @IsString()
  @MaxLength(320)
  address!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;
}

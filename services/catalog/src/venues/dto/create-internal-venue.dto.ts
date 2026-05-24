import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from "class-validator";

/** Alta mínima desde partner-service al aprobar un claim de centro nuevo (token interno). */
export class CreateInternalVenueDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(240)
  name!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(320)
  address!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  zone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(48)
  venueType!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lng?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(24)
  modalities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  amenities?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMin?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  priceMax?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  completenessScore?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  popularityScore?: number;

  @IsOptional()
  @IsBoolean()
  allowsTrial?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactWhatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];
}

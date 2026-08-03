import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from "class-validator";

export class UpdatePartnerSyncDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  scheduleSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactWhatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsBoolean()
  allowsTrial?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  modalities?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  amenities?: string[];

  @IsOptional()
  @IsArray()
  plans?: Array<{
    name: string;
    description?: string | null;
    period?: string | null;
    priceLabel?: string | null;
    active: boolean;
  }>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsUrl({ require_tld: false }, { each: true })
  photoUrls?: string[];
}

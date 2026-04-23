import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePartnerSyncDto {
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

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
  plans?: Array<{
    name: string;
    description?: string | null;
    period?: string | null;
    priceLabel?: string | null;
    active: boolean;
  }>;
}

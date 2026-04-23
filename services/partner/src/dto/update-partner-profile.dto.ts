import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePartnerProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  businessName?: string;

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
  @IsEmail()
  @MaxLength(200)
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactWhatsapp?: string;
}

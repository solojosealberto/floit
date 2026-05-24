import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateTaxonomyAttributeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  icon?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

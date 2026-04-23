import {
  Equals,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  venueSlug!: string;

  @IsIn(["membership", "trial", "info"])
  intent!: "membership" | "trial" | "info";

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  preferredSlot?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  message?: string;

  @IsBoolean()
  @Equals(true)
  consentAccepted!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  consentVersion?: string;
}

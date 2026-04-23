import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreatePartnerClaimDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  venueSlug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  representativeName!: string;

  @IsEmail()
  @MaxLength(200)
  representativeEmail!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(40)
  representativePhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  evidence?: string;
}

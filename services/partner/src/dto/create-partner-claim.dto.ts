import { Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { PartnerClaimNewVenueDraftDto } from "./partner-claim-new-venue-draft.dto";

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

  /** Si se omite, se asume `existing` (compatibilidad clientes antiguos). */
  @IsOptional()
  @IsIn(["existing", "new"])
  claimKind?: "existing" | "new";

  @ValidateIf((o: CreatePartnerClaimDto) => o.claimKind === "new")
  @IsNotEmpty({ message: "newVenueDraft_required_when_claim_new" })
  @ValidateNested()
  @Type(() => PartnerClaimNewVenueDraftDto)
  newVenueDraft?: PartnerClaimNewVenueDraftDto;
}

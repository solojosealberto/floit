import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import type { TaxonomyKind } from "../taxonomy-attribute.entity";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateTaxonomyAttributeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_RE, {
    message: "slug_invalid",
  })
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  label!: string;

  @IsIn(["modality", "amenity"])
  kind!: TaxonomyKind;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  icon?: string;
}

import { Transform, Type } from "class-transformer";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class ListVenuesQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  zone?: string;

  @IsOptional()
  @IsString()
  venue_type?: string;

  /** Modalidad puntual (cualquier coincidencia en el arreglo del venue) */
  @IsOptional()
  @IsString()
  modality?: string;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget_min?: number;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budget_max?: number;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @Transform(({ value }) => optionalNumber(value))
  @Type(() => Number)
  @IsNumber()
  @Min(0.5)
  @Max(80)
  radius_km?: number;

  @IsOptional()
  @IsIn([
    "relevance",
    "distance",
    "price_asc",
    "price_desc",
    "name",
    "popularity",
  ])
  sort?:
    | "relevance"
    | "distance"
    | "price_asc"
    | "price_desc"
    | "name"
    | "popularity";
}

function optionalNumber(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

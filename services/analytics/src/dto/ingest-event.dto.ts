import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class IngestEventDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;
}

import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

export class CreateVenueReportDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @IsIn(["precio", "ubicacion", "horario", "info", "otro"])
  kind!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(1200)
  message!: string;
}

import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class PatchAdminLeadDto {
  @IsOptional()
  @IsIn(["received", "contacted", "closed"])
  status?: "received" | "contacted" | "closed";

  @IsOptional()
  @IsBoolean()
  suspicious?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  adminNote?: string | null;
}

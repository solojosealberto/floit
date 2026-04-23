import { IsIn } from "class-validator";

export class UpdateInternalLeadStatusDto {
  @IsIn(["contacted", "closed"])
  status!: "contacted" | "closed";
}

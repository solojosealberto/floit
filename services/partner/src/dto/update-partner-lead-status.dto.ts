import { IsIn } from "class-validator";

export class UpdatePartnerLeadStatusDto {
  @IsIn(["contacted", "closed"])
  status!: "contacted" | "closed";
}

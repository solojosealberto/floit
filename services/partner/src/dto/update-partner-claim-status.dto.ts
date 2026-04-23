import { IsIn } from "class-validator";

export class UpdatePartnerClaimStatusDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";
}

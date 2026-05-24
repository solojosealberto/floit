import { IsIn } from "class-validator";

export class MovePartnerVenuePhotoDto {
  @IsIn(["up", "down"])
  direction!: "up" | "down";
}

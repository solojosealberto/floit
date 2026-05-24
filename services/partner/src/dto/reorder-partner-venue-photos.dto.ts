import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class ReorderPartnerVenuePhotosDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsUUID("4", { each: true })
  photoIds!: string[];
}

import { IsNotEmpty, IsString } from "class-validator";

/** The store or product type an entry is merged into (PFA-224). */
export class MergeDto {
  @IsString()
  @IsNotEmpty()
  targetID: string;
}

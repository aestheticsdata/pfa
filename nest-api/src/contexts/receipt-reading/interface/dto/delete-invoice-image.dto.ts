import { IsNotEmpty, IsString } from "class-validator";

export class DeleteInvoiceImageDto {
  @IsString()
  @IsNotEmpty()
  ID: string;

  @IsString()
  @IsNotEmpty()
  itemType: string;

  @IsString()
  @IsNotEmpty()
  invoicefile: string;
}

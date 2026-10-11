import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
import { ProductTypeNameDto } from "@spendings/catalog/dto/product-type-name.dto";
import { MergeDto } from "@spendings/catalog/dto/merge.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("product-types")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ProductTypesController {
  constructor(private readonly productTypes: ProductTypesService) {}

  /** The user's generic products, for the type field of each receipt line (PFA-219). */
  @Get()
  async list(@GetUserId() userID: string) {
    return this.productTypes.list(userID);
  }

  /** The types with their purchase counts and likely duplicates, to manage them (PFA-224). */
  @Get("usage")
  async usage(@GetUserId() userID: string) {
    return this.productTypes.usage(userID);
  }

  @Patch(":typeID")
  async rename(@Param("typeID") typeID: string, @Body() { name }: ProductTypeNameDto, @GetUserId() userID: string) {
    return this.productTypes.rename(typeID, name, userID);
  }

  @Post(":typeID/merge")
  async merge(@Param("typeID") typeID: string, @Body() { targetID }: MergeDto, @GetUserId() userID: string) {
    return this.productTypes.merge(typeID, targetID, userID);
  }

  @Delete(":typeID")
  async remove(@Param("typeID") typeID: string, @GetUserId() userID: string) {
    return this.productTypes.remove(typeID, userID);
  }
}

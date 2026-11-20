import { ProductTypesService } from "@contexts/price-comparison/application/product-types.service";
import { MergeDto } from "@contexts/price-comparison/interface/dto/merge.dto";
import { ProductTypeNameDto } from "@contexts/price-comparison/interface/dto/product-type-name.dto";
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
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
    return this.productTypes.rename({ id: typeID, ownerId: userID }, name);
  }

  @Post(":typeID/merge")
  async merge(@Param("typeID") typeID: string, @Body() { targetID }: MergeDto, @GetUserId() userID: string) {
    return this.productTypes.merge(typeID, targetID, userID);
  }

  @Delete(":typeID")
  async remove(@Param("typeID") typeID: string, @GetUserId() userID: string) {
    return this.productTypes.remove({ id: typeID, ownerId: userID });
  }
}

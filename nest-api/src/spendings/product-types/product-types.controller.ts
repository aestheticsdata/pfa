import { Controller, Get, UseGuards } from "@nestjs/common";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
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
}

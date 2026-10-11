import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { PricesService } from "@spendings/prices/prices.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

/** Price comparison by store per product type (PFA-220). */
@Controller("prices")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class PricesController {
  constructor(private readonly prices: PricesService) {}

  @Get()
  async summary(@GetUserId() userID: string) {
    return this.prices.summary(userID);
  }

  @Get(":typeID")
  async comparison(@Param("typeID") typeID: string, @GetUserId() userID: string) {
    return this.prices.comparison(typeID, userID);
  }
}

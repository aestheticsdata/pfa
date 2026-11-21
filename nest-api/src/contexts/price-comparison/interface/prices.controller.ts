import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { PricesService } from "@contexts/price-comparison/application/prices.service";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";

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
    return this.prices.comparison({ id: typeID, ownerId: userID });
  }
}

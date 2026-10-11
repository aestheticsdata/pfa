import { Controller, Get, UseGuards } from "@nestjs/common";
import { StoresService } from "@spendings/stores/stores.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("stores")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  /** The user's stores, for the store field of the receipt-lines modal (PFA-218). */
  @Get()
  async list(@GetUserId() userID: string) {
    return this.stores.list(userID);
  }
}

import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ReceiptProposalsService } from "@spendings/receipt-proposals/receipt-proposals.service";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

/** Reading the user's saved receipts in bulk, then reviewing them (PFA-223). */
@Controller("receipt-proposals")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ReceiptProposalsController {
  constructor(private readonly proposals: ReceiptProposalsService) {}

  @Get()
  async status(@GetUserId() userID: string) {
    return this.proposals.status(userID);
  }

  @Post()
  async start(@GetUserId() userID: string) {
    return this.proposals.start(userID);
  }

  @Get("next")
  async next(@GetUserId() userID: string) {
    return this.proposals.next(userID);
  }

  @Post(":spendingID/skip")
  async skip(@Param("spendingID") spendingID: string, @GetUserId() userID: string) {
    return this.proposals.skip(spendingID, userID);
  }
}

import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { BulkReceiptReadService } from "@contexts/receipt-reading/application/bulk-receipt-read.service";
import { Controller, Get, Param, Post, UseGuards } from "@nestjs/common";

/** Reading the user's saved receipts in bulk, then reviewing them (PFA-223). */
@Controller("receipt-proposals")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ReceiptProposalsController {
  constructor(private readonly proposals: BulkReceiptReadService) {}

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

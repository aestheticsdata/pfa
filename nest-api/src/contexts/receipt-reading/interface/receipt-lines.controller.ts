import { ReceiptLinesService } from "@contexts/receipt-reading/application/receipt-lines.service";
import { SaveReceiptLinesDto } from "@contexts/receipt-reading/interface/dto/save-receipt-lines.dto";
import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("spendings/:id/lines")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ReceiptLinesController {
  constructor(private readonly receiptLines: ReceiptLinesService) {}

  @Get()
  async read(@Param("id") id: string, @GetUserId() userID: string) {
    return this.receiptLines.read({ spendingId: id, ownerId: userID });
  }

  @Put()
  async save(@Param("id") id: string, @Body() dto: SaveReceiptLinesDto, @GetUserId() userID: string) {
    return this.receiptLines.save({ spendingId: id, ownerId: userID }, { lines: dto.lines, store: dto.store });
  }

  /** Runs the OCR on the spending's receipt and answers with the proposed lines. */
  @Post("ocr")
  async propose(@Param("id") id: string, @GetUserId() userID: string) {
    return this.receiptLines.propose({ spendingId: id, ownerId: userID });
  }
}

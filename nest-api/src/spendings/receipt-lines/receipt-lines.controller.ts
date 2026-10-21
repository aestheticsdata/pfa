import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { SaveReceiptLinesDto } from "@spendings/receipt-lines/dto/save-receipt-lines.dto";
import { ReceiptLinesService } from "@spendings/receipt-lines/receipt-lines.service";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("spendings/:id/lines")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ReceiptLinesController {
  constructor(private readonly receiptLines: ReceiptLinesService) {}

  @Get()
  async read(@Param("id") id: string, @GetUserId() userID: string) {
    return this.receiptLines.read(id, userID);
  }

  @Put()
  async save(@Param("id") id: string, @Body() dto: SaveReceiptLinesDto, @GetUserId() userID: string) {
    return this.receiptLines.save(id, userID, { lines: dto.lines, store: dto.store });
  }

  /** Runs the OCR on the spending's receipt and answers with the proposed lines. */
  @Post("ocr")
  async propose(@Param("id") id: string, @GetUserId() userID: string) {
    return this.receiptLines.propose(id, userID);
  }
}

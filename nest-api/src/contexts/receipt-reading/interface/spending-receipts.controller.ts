import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { ReceiptAttachmentsService } from "@contexts/receipt-reading/application/receipt-attachments.service";
import { invoiceUploadOptions } from "@contexts/receipt-reading/infrastructure/files/upload.config";
import { SpendingIdsDto } from "@contexts/receipt-reading/interface/dto/spending-ids.dto";
import { BadRequestException, Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

@Controller("spendings/receipts")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingReceiptsController {
  constructor(private readonly receipts: ReceiptAttachmentsService) {}

  /**
   * Multipart: `spendingIDs` (JSON array), then `itemType`/`date`/`label` for
   * the file name, the file last — multer names it from the fields before it.
   */
  @Post()
  @UseInterceptors(FileInterceptor("invoiceImageUpload", invoiceUploadOptions))
  async share(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { spendingIDs?: string },
    @GetUserId() userID: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    const spendingIDs = parseIds(body.spendingIDs);
    return this.receipts.share({ path: file.path, filename: file.filename }, spendingIDs, userID);
  }

  @Post("detach")
  async detach(@Body() dto: SpendingIdsDto, @GetUserId() userID: string) {
    return this.receipts.detach(dto.spendingIDs, userID);
  }
}

function parseIds(raw: string | undefined): string[] {
  try {
    const ids: unknown = JSON.parse(raw ?? "");
    if (Array.isArray(ids) && ids.length > 0 && ids.every((id) => typeof id === "string")) {
      return ids;
    }
  } catch {
    // Falls through to the 400 below.
  }
  throw new BadRequestException("spendingIDs must be a non-empty JSON array");
}

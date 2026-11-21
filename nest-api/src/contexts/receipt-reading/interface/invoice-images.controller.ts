import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { InvoiceImagesService } from "@contexts/receipt-reading/application/invoice-images.service";
import { invoiceUploadOptions } from "@contexts/receipt-reading/infrastructure/files/upload.config";
import { DeleteInvoiceImageDto } from "@contexts/receipt-reading/interface/dto/delete-invoice-image.dto";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

/**
 * The receipt image of a spending, an exceptional or a recurring (PFA-278), on the
 * `/spendings/upload` routes it has always had. Registered before the Spending context's
 * controller, so `DELETE /spendings/upload` is never taken for `DELETE /spendings/:id`.
 */
@Controller("spendings")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class InvoiceImagesController {
  constructor(private readonly invoiceImages: InvoiceImagesService) {}

  @Delete("upload")
  async deleteInvoiceImage(@Body() dto: DeleteInvoiceImageDto, @GetUserId() userID: string): Promise<{ msg: string }> {
    return this.invoiceImages.remove({ ownerId: userID, id: dto.ID, kind: dto.itemType }, dto.invoicefile);
  }

  @Post("upload")
  @UseInterceptors(FileInterceptor("invoiceImageUpload", invoiceUploadOptions))
  async uploadInvoiceImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { spendingID: string; itemType: string },
    @GetUserId() userID: string,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    if (!body.spendingID || !body.itemType) {
      throw new BadRequestException("spendingID and itemType are required");
    }
    const result = await this.invoiceImages.replace(
      { ownerId: userID, id: body.spendingID, kind: body.itemType },
      { path: file.path, filename: file.filename },
    );
    res.status(200).setHeader("Content-Type", result.contentType);
    return res.send(result.data);
  }

  @Get("upload/:id")
  async getInvoiceImage(
    @Param("id") id: string,
    @Query("itemType") itemType: string,
    @GetUserId() userID: string,
    @Res() res: Response,
  ) {
    if (!itemType) {
      return res.status(400).json({ message: "itemType query param is required" });
    }
    const result = await this.invoiceImages.read({ ownerId: userID, id, kind: itemType });
    if (!result) {
      return res.status(200).json(null);
    }
    res.setHeader("Content-Type", result.contentType);
    return res.send(result.data);
  }
}

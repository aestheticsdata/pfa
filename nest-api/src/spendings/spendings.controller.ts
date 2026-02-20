import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { SpendingsService } from "@spendings/spendings.service";
import { CreateSpendingDto } from "@spendings/dto/create-spending.dto";
import { UpdateSpendingDto } from "@spendings/dto/update-spending.dto";
import { DeleteInvoiceImageDto } from "@spendings/dto/delete-invoice-image.dto";
import { SpendingsQueryDto } from "@spendings/dto/spendings-query.dto";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { invoiceUploadOptions } from "@spendings/upload/upload.config";

@Controller("spendings")
@UseGuards(JwtAuthGuard)
export class SpendingsController {
  constructor(private readonly spendingsService: SpendingsService) {}

  @Get()
  async getSpendings(@Query() query: SpendingsQueryDto, @GetUserId() userID: string) {
    return this.spendingsService.getSpendings(query.from, query.to, userID);
  }

  @Post()
  async createSpending(@Body() dto: CreateSpendingDto, @GetUserId() userID: string) {
    return this.spendingsService.createSpending(dto, userID);
  }

  @Get("charts")
  async getSpendingsCharts(@Query() query: SpendingsQueryDto, @GetUserId() userID: string) {
    const result: { value: unknown; category: string | null; categoryColor: string | null }[] =
      await this.spendingsService.getSpendingsCharts(query.from, query.to, userID);
    return result;
  }

  @Put("upload")
  async deleteInvoiceImage(@Body() dto: DeleteInvoiceImageDto, @GetUserId() userID: string): Promise<{ msg: string }> {
    const result: { msg: string } = await this.spendingsService.deleteInvoiceImage(
      dto.ID,
      userID,
      dto.itemType,
      dto.invoicefile,
    );
    return result;
  }

  @Put(":id")
  async updateSpending(@Param("id") id: string, @Body() dto: UpdateSpendingDto, @GetUserId() userID: string) {
    return this.spendingsService.updateSpending(id, userID, dto);
  }

  @Delete(":id")
  async deleteSpending(@Param("id") id: string, @GetUserId() userID: string) {
    return this.spendingsService.deleteSpending(id, userID);
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
    const result = await this.spendingsService.uploadInvoiceImage(
      file.path,
      file.filename,
      body.spendingID,
      userID,
      body.itemType,
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
    const result = await this.spendingsService.getInvoiceImage(id, userID, itemType);
    if (!result) {
      return res.status(200).json(null);
    }
    res.setHeader("Content-Type", result.contentType);
    return res.send(result.data);
  }
}

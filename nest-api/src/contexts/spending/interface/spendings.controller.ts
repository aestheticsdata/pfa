import { DeleteSpending } from "@contexts/spending/application/delete-spending.use-case";
import { RecordSpending } from "@contexts/spending/application/record-spending.use-case";
import { ReviseSpending } from "@contexts/spending/application/revise-spending.use-case";
import { SpendingQueries } from "@contexts/spending/infrastructure/queries/spending.queries";
import { CreateSpendingDto } from "@contexts/spending/interface/dto/create-spending.dto";
import { LabelSuggestionsQueryDto } from "@contexts/spending/interface/dto/label-suggestions-query.dto";
import { SpendingsQueryDto } from "@contexts/spending/interface/dto/spendings-query.dto";
import { SpendingsSearchQueryDto } from "@contexts/spending/interface/dto/spendings-search-query.dto";
import { UpdateSpendingDto } from "@contexts/spending/interface/dto/update-spending.dto";
import type { UserKind } from "@monitoring/interfaces/monitoringTypes";
import { MetricsService } from "@monitoring/metrics.service";
import { GetUserKind } from "@monitoring/user-kind.decorator";
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
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { DeleteInvoiceImageDto } from "@spendings/dto/delete-invoice-image.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { InvoiceImagesService } from "@spendings/receipts/invoice-images.service";
import { invoiceUploadOptions } from "@spendings/upload/upload.config";
import { CsrfGuard } from "@users/guards/csrf.guard";
import type { Response } from "express";

@Controller("spendings")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingsController {
  constructor(
    private readonly recordSpending: RecordSpending,
    private readonly reviseSpending: ReviseSpending,
    private readonly deleteSpending: DeleteSpending,
    private readonly queries: SpendingQueries,
    private readonly invoiceImages: InvoiceImagesService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  async getSpendings(@Query() query: SpendingsQueryDto, @GetUserId() userID: string) {
    return this.queries.getSpendings(query.from, query.to, userID);
  }

  @Post()
  async createSpending(@Body() dto: CreateSpendingDto, @GetUserId() userID: string, @GetUserKind() userKind: UserKind) {
    const created = await this.recordSpending.execute({ ...dto, ownerId: userID });
    this.metrics.countSpendingsCreated(userKind);
    return created;
  }

  @Get("search")
  async searchSpendings(@Query() query: SpendingsSearchQueryDto, @GetUserId() userID: string) {
    return this.queries.searchSpendings(userID, query);
  }

  @Get("years")
  async getSpendingYears(@GetUserId() userID: string) {
    return this.queries.getSpendingYears(userID);
  }

  @Get("label-suggestions")
  async getLabelSuggestions(@Query() query: LabelSuggestionsQueryDto, @GetUserId() userID: string) {
    return this.queries.getLabelSuggestions(query.q ?? "", userID);
  }

  @Delete("upload")
  async deleteInvoiceImage(@Body() dto: DeleteInvoiceImageDto, @GetUserId() userID: string): Promise<{ msg: string }> {
    return this.invoiceImages.deleteInvoiceImage(userID, dto);
  }

  @Put(":id")
  async updateSpending(@Param("id") id: string, @Body() dto: UpdateSpendingDto, @GetUserId() userID: string) {
    return this.reviseSpending.execute({ ...dto, spendingId: id, ownerId: userID });
  }

  @Delete(":id")
  async removeSpending(@Param("id") id: string, @GetUserId() userID: string) {
    return this.deleteSpending.execute({ id, ownerId: userID });
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
    const result = await this.invoiceImages.uploadInvoiceImage(userID, {
      filepath: file.path,
      filename: file.filename,
      spendingID: body.spendingID,
      itemType: body.itemType,
    });
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
    const result = await this.invoiceImages.getInvoiceImage(id, userID, itemType);
    if (!result) {
      return res.status(200).json(null);
    }
    res.setHeader("Content-Type", result.contentType);
    return res.send(result.data);
  }
}

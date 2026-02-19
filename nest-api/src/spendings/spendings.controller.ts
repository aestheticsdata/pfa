import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { SpendingsService } from "@spendings/spendings.service";
import { SpendingsQueryDto } from "@spendings/dto/spendings-query.dto";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";

@Controller("spendings")
@UseGuards(JwtAuthGuard)
export class SpendingsController {
  constructor(private readonly spendingsService: SpendingsService) {}

  @Get()
  async getSpendings(@Query() query: SpendingsQueryDto, @GetUserId() userID: string) {
    return this.spendingsService.getSpendings(query.from, query.to, userID);
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

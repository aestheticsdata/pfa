import { Controller, Get, Query, UseGuards } from "@nestjs/common";
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
}

import { RecurringsService } from "@contexts/budget-planning/application/recurrings.service";
import { CopyRecurringsDto } from "@contexts/budget-planning/interface/dto/copy-recurrings.dto";
import { CreateRecurringDto } from "@contexts/budget-planning/interface/dto/create-recurring.dto";
import { RecurringsDrawnQueryDto } from "@contexts/budget-planning/interface/dto/recurrings-drawn-query.dto";
import { RecurringsQueryDto } from "@contexts/budget-planning/interface/dto/recurrings-query.dto";
import { UpdateRecurringDto } from "@contexts/budget-planning/interface/dto/update-recurring.dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("recurrings")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class RecurringsController {
  constructor(private readonly recurringsService: RecurringsService) {}

  @Get()
  async getRecurrings(@Query() query: RecurringsQueryDto, @GetUserId() userID: string) {
    return this.recurringsService.month(query.start, userID);
  }

  // Real year-to-date "déjà prélevé" for the Statistics fixed-expenses widget
  // (COS-49) — sums the per-month recurring rows Jan → the client's current month.
  @Get("drawn")
  async getDrawn(@Query() query: RecurringsDrawnQueryDto, @GetUserId() userID: string): Promise<{ drawn: number }> {
    return this.recurringsService.drawn(query.year, query.month, userID);
  }

  @Post()
  async createRecurring(@Body() dto: CreateRecurringDto, @GetUserId() userID: string): Promise<{ message: string }> {
    return this.recurringsService.add({
      ownerId: userID,
      start: dto.start,
      end: dto.end,
      label: dto.label,
      amount: dto.amount,
      currency: dto.currency,
      category: dto.category,
    });
  }

  @Put(":id")
  async updateRecurring(@Param("id") id: string, @Body() dto: UpdateRecurringDto, @GetUserId() userID: string) {
    return this.recurringsService.edit({ id, ownerId: userID }, dto);
  }

  @Post("copy")
  @HttpCode(HttpStatus.OK)
  async copyRecurrings(@Body() dto: CopyRecurringsDto, @GetUserId() userID: string) {
    return this.recurringsService.copy({ ...dto.dates, ownerId: userID });
  }

  @Delete(":id")
  async deleteRecurring(@Param("id") id: string, @GetUserId() userID: string) {
    return this.recurringsService.remove({ id, ownerId: userID });
  }
}

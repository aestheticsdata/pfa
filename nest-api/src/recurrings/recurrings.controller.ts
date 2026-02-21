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
import { RecurringsService } from "@recurrings/recurrings.service";
import { CreateRecurringDto } from "@recurrings/dto/create-recurring.dto";
import { UpdateRecurringDto } from "@recurrings/dto/update-recurring.dto";
import { RecurringsQueryDto } from "@recurrings/dto/recurrings-query.dto";
import { CopyRecurringsDto } from "@recurrings/dto/copy-recurrings.dto";
import { JwtAuthGuard } from "@spendings/guards/jwt-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";

@Controller("recurrings")
@UseGuards(JwtAuthGuard)
export class RecurringsController {
  constructor(private readonly recurringsService: RecurringsService) {}

  @Get()
  async getRecurrings(@Query() query: RecurringsQueryDto, @GetUserId() userID: string) {
    return this.recurringsService.getRecurrings(query.start, userID);
  }

  @Post()
  async createRecurring(@Body() dto: CreateRecurringDto, @GetUserId() userID: string): Promise<{ message: string }> {
    return this.recurringsService.createRecurring(
      {
        start: dto.start,
        end: dto.end,
        label: dto.label,
        amount: dto.amount,
        currency: dto.currency,
      },
      userID,
    );
  }

  @Put(":id")
  async updateRecurring(@Param("id") id: string, @Body() dto: UpdateRecurringDto, @GetUserId() userID: string) {
    return this.recurringsService.updateRecurring(id, userID, dto);
  }

  @Post("copy")
  @HttpCode(HttpStatus.OK)
  async copyRecurrings(@Body() dto: CopyRecurringsDto, @GetUserId() userID: string) {
    return this.recurringsService.copyRecurrings(userID, dto.dates);
  }

  @Delete(":id")
  async deleteRecurring(@Param("id") id: string, @GetUserId() userID: string) {
    return this.recurringsService.deleteRecurring(id, userID);
  }
}

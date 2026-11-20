import { ExceptionalsService } from "@contexts/budget-planning/application/exceptionals.service";
import { CreateExceptionalDto } from "@contexts/budget-planning/interface/dto/create-exceptional.dto";
import { ExceptionalsQueryDto } from "@contexts/budget-planning/interface/dto/exceptionals-query.dto";
import { UpdateExceptionalDto } from "@contexts/budget-planning/interface/dto/update-exceptional.dto";
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("exceptionals")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ExceptionalsController {
  constructor(private readonly exceptionalsService: ExceptionalsService) {}

  @Get()
  async getExceptionals(@Query() query: ExceptionalsQueryDto, @GetUserId() userID: string) {
    return this.exceptionalsService.list(userID, query.year);
  }

  @Get("years")
  async getYears(@GetUserId() userID: string) {
    return this.exceptionalsService.years(userID);
  }

  @Post()
  async createExceptional(@Body() dto: CreateExceptionalDto, @GetUserId() userID: string) {
    return this.exceptionalsService.add(dto, userID);
  }

  @Put(":id")
  async updateExceptional(@Param("id") id: string, @Body() dto: UpdateExceptionalDto, @GetUserId() userID: string) {
    return this.exceptionalsService.edit({ id, ownerId: userID }, dto);
  }

  @Delete(":id")
  async deleteExceptional(@Param("id") id: string, @GetUserId() userID: string) {
    return this.exceptionalsService.remove({ id, ownerId: userID });
  }
}

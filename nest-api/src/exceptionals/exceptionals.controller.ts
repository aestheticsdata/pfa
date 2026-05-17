import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ExceptionalsService } from "@exceptionals/exceptionals.service";
import { CreateExceptionalDto } from "@exceptionals/dto/create-exceptional.dto";
import { UpdateExceptionalDto } from "@exceptionals/dto/update-exceptional.dto";
import { ExceptionalsQueryDto } from "@exceptionals/dto/exceptionals-query.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("exceptionals")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class ExceptionalsController {
  constructor(private readonly exceptionalsService: ExceptionalsService) {}

  @Get()
  async getExceptionals(@Query() query: ExceptionalsQueryDto, @GetUserId() userID: string) {
    return this.exceptionalsService.getExceptionals(userID, query.year);
  }

  @Get("years")
  async getYears(@GetUserId() userID: string) {
    return this.exceptionalsService.getAvailableYears(userID);
  }

  @Post()
  async createExceptional(@Body() dto: CreateExceptionalDto, @GetUserId() userID: string) {
    return this.exceptionalsService.createExceptional(dto, userID);
  }

  @Put(":id")
  async updateExceptional(@Param("id") id: string, @Body() dto: UpdateExceptionalDto, @GetUserId() userID: string) {
    return this.exceptionalsService.updateExceptional(id, userID, dto);
  }

  @Delete(":id")
  async deleteExceptional(@Param("id") id: string, @GetUserId() userID: string) {
    return this.exceptionalsService.deleteExceptional(id, userID);
  }
}

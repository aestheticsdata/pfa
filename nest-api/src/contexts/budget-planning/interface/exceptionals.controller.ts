import { ExceptionalsService } from "@contexts/budget-planning/application/exceptionals.service";
import { CreateExceptionalDto } from "@contexts/budget-planning/interface/dto/create-exceptional.dto";
import { ExceptionalsQueryDto } from "@contexts/budget-planning/interface/dto/exceptionals-query.dto";
import { UpdateExceptionalDto } from "@contexts/budget-planning/interface/dto/update-exceptional.dto";
import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";

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

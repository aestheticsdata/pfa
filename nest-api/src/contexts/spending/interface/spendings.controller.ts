import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
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
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";

@Controller("spendings")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingsController {
  constructor(
    private readonly recordSpending: RecordSpending,
    private readonly reviseSpending: ReviseSpending,
    private readonly deleteSpending: DeleteSpending,
    private readonly queries: SpendingQueries,
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

  @Put(":id")
  async updateSpending(@Param("id") id: string, @Body() dto: UpdateSpendingDto, @GetUserId() userID: string) {
    return this.reviseSpending.execute({ ...dto, spendingId: id, ownerId: userID });
  }

  @Delete(":id")
  async removeSpending(@Param("id") id: string, @GetUserId() userID: string) {
    return this.deleteSpending.execute({ id, ownerId: userID });
  }
}

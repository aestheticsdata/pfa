import { Body, Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";
import { CreateSpendingGroupDto } from "@spendings/dto/create-spending-group.dto";
import { UpdateSpendingGroupDto } from "@spendings/dto/update-spending-group.dto";
import { MergeSpendingGroupDto } from "@spendings/dto/merge-spending-group.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";
import { MetricsService } from "@monitoring/metrics.service";
import { GetUserKind } from "@monitoring/user-kind.decorator";

import type { UserKind } from "@monitoring/interfaces/monitoringTypes";

@Controller("spendings/groups")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingGroupsController {
  constructor(
    private readonly groups: SpendingGroupsService,
    private readonly metrics: MetricsService,
  ) {}

  /** Each line of a group is a spending, and counts as one (PFA-212). */
  @Post()
  async create(@Body() dto: CreateSpendingGroupDto, @GetUserId() userID: string, @GetUserKind() userKind: UserKind) {
    const created = await this.groups.create(dto, userID);
    this.metrics.countSpendingsCreated(userKind, created.spendingIDs.length);
    return created;
  }

  @Post("merge")
  async merge(@Body() dto: MergeSpendingGroupDto, @GetUserId() userID: string) {
    return this.groups.merge(dto, userID);
  }

  /** A line without an ID is added while editing: a new spending. */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateSpendingGroupDto,
    @GetUserId() userID: string,
    @GetUserKind() userKind: UserKind,
  ) {
    const updated = await this.groups.update(id, dto, userID);
    this.metrics.countSpendingsCreated(userKind, dto.lines.filter((line) => !line.ID).length);
    return updated;
  }

  @Post(":id/ungroup")
  async ungroup(@Param("id") id: string, @GetUserId() userID: string) {
    return this.groups.ungroup(id, userID);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @GetUserId() userID: string) {
    return this.groups.delete(id, userID);
  }
}

import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { CreateSpendingGroup } from "@contexts/spending/application/create-spending-group.use-case";
import { DeleteSpendingGroup } from "@contexts/spending/application/delete-spending-group.use-case";
import { EditSpendingGroup } from "@contexts/spending/application/edit-spending-group.use-case";
import { MergeSpendingsIntoGroup } from "@contexts/spending/application/merge-spendings-into-group.use-case";
import { UngroupSpendingGroup } from "@contexts/spending/application/ungroup-spending-group.use-case";
import { CreateSpendingGroupDto } from "@contexts/spending/interface/dto/create-spending-group.dto";
import { MergeSpendingGroupDto } from "@contexts/spending/interface/dto/merge-spending-group.dto";
import { UpdateSpendingGroupDto } from "@contexts/spending/interface/dto/update-spending-group.dto";
import type { UserKind } from "@monitoring/interfaces/monitoringTypes";
import { MetricsService } from "@monitoring/metrics.service";
import { GetUserKind } from "@monitoring/user-kind.decorator";
import { Body, Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";

@Controller("spendings/groups")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingGroupsController {
  constructor(
    private readonly createGroup: CreateSpendingGroup,
    private readonly mergeSpendings: MergeSpendingsIntoGroup,
    private readonly editGroup: EditSpendingGroup,
    private readonly ungroupGroup: UngroupSpendingGroup,
    private readonly deleteGroup: DeleteSpendingGroup,
    private readonly metrics: MetricsService,
  ) {}

  /** Each line of a group is a spending, and counts as one (PFA-212). */
  @Post()
  async create(@Body() dto: CreateSpendingGroupDto, @GetUserId() userID: string, @GetUserKind() userKind: UserKind) {
    const created = await this.createGroup.execute({ ...dto, ownerId: userID });
    this.metrics.countSpendingsCreated(userKind, created.spendingIDs.length);
    return created;
  }

  @Post("merge")
  async merge(@Body() dto: MergeSpendingGroupDto, @GetUserId() userID: string) {
    return this.mergeSpendings.execute({ ...dto, ownerId: userID });
  }

  /** A line without an ID is added while editing: a new spending. */
  @Put(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateSpendingGroupDto,
    @GetUserId() userID: string,
    @GetUserKind() userKind: UserKind,
  ) {
    const updated = await this.editGroup.execute({ ...dto, groupId: id, ownerId: userID });
    this.metrics.countSpendingsCreated(userKind, dto.lines.filter((line) => !line.ID).length);
    return updated;
  }

  @Post(":id/ungroup")
  async ungroup(@Param("id") id: string, @GetUserId() userID: string) {
    return this.ungroupGroup.execute({ id, ownerId: userID });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @GetUserId() userID: string) {
    return this.deleteGroup.execute({ id, ownerId: userID });
  }
}

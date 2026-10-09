import { Body, Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { SpendingGroupsService } from "@spendings/groups/spending-groups.service";
import { CreateSpendingGroupDto } from "@spendings/dto/create-spending-group.dto";
import { UpdateSpendingGroupDto } from "@spendings/dto/update-spending-group.dto";
import { MergeSpendingGroupDto } from "@spendings/dto/merge-spending-group.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

@Controller("spendings/groups")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class SpendingGroupsController {
  constructor(private readonly groups: SpendingGroupsService) {}

  @Post()
  async create(@Body() dto: CreateSpendingGroupDto, @GetUserId() userID: string) {
    return this.groups.create(dto, userID);
  }

  @Post("merge")
  async merge(@Body() dto: MergeSpendingGroupDto, @GetUserId() userID: string) {
    return this.groups.merge(dto, userID);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateSpendingGroupDto, @GetUserId() userID: string) {
    return this.groups.update(id, dto, userID);
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

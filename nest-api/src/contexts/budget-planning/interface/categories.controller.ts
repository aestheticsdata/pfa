import { CategoriesService } from "@contexts/budget-planning/application/categories.service";
import type { CategoryItem } from "@contexts/budget-planning/domain/interfaces/budgetPlanningTypes";
import { UpdateCategoryDto } from "@contexts/budget-planning/interface/dto/update-category.dto";
import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { Body, Controller, Delete, Get, Param, Put, UseGuards } from "@nestjs/common";

@Controller("categories")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@GetUserId() userID: string): Promise<CategoryItem[]> {
    return await this.categoriesService.list(userID);
  }

  @Put(":id")
  async updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
    @GetUserId() userID: string,
  ): Promise<CategoryItem[]> {
    return await this.categoriesService.edit({ id, ownerId: userID }, dto);
  }

  @Delete(":id")
  async deleteCategory(@Param("id") id: string, @GetUserId() userID: string): Promise<{ success: boolean }> {
    return await this.categoriesService.remove({ id, ownerId: userID });
  }
}

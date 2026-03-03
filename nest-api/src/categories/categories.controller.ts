import { Body, Controller, Delete, Get, Param, Put, UseGuards } from "@nestjs/common";
import { CategoriesService } from "@categories/categories.service";
import { UpdateCategoryDto } from "@categories/dto/update-category.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

import type { Categories } from "../../generated/prisma/client";

@Controller("categories")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getCategories(@GetUserId() userID: string): Promise<Categories[]> {
    return await this.categoriesService.getCategories(userID);
  }

  @Put(":id")
  async updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
    @GetUserId() userID: string,
  ): Promise<Categories[]> {
    return await this.categoriesService.updateCategory(id, userID, dto);
  }

  @Delete(":id")
  async deleteCategory(@Param("id") id: string, @GetUserId() userID: string): Promise<{ success: boolean }> {
    return await this.categoriesService.deleteCategory(id, userID);
  }
}

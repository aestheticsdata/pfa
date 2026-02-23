import { Module } from "@nestjs/common";
import { CategoriesController } from "@categories/categories.controller";
import { CategoriesService } from "@categories/categories.service";
import { PrismaModule } from "../prisma/prisma.module";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, SessionAuthGuard],
})
export class CategoriesModule {}

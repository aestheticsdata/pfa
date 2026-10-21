import { CategoriesController } from "@categories/categories.controller";
import { CategoriesService } from "@categories/categories.service";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, SessionAuthGuard],
})
export class CategoriesModule {}

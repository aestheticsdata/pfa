import { MonitoringModule } from "@monitoring/monitoring.module";
import { Module } from "@nestjs/common";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { PricesController } from "@spendings/prices/prices.controller";
import { PricesService } from "@spendings/prices/prices.service";
import { ProductTypesController } from "@spendings/product-types/product-types.controller";
import { ProductTypesService } from "@spendings/product-types/product-types.service";
import { StoresController } from "@spendings/stores/stores.controller";
import { StoresService } from "@spendings/stores/stores.service";

/** Stores, product types and prices: the price comparison context, still to be moved (PFA-275). */
@Module({
  imports: [MonitoringModule],
  controllers: [StoresController, ProductTypesController, PricesController],
  providers: [StoresService, ProductTypesService, PricesService, SessionAuthGuard],
  // Receipt reading recognises stores and links product types through these (PFA-274).
  exports: [StoresService, ProductTypesService],
})
export class SpendingsModule {}

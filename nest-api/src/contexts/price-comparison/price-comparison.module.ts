import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { PricesService } from "@contexts/price-comparison/application/prices.service";
import { ProductTypesService } from "@contexts/price-comparison/application/product-types.service";
import { StoresService } from "@contexts/price-comparison/application/stores.service";
import { PriceReadModel } from "@contexts/price-comparison/domain/ports/price-read-model";
import { ProductTypeRepository } from "@contexts/price-comparison/domain/ports/product-type.repository";
import { StoreRepository } from "@contexts/price-comparison/domain/ports/store.repository";
import { PrismaPriceReadModel } from "@contexts/price-comparison/infrastructure/prisma-price-read-model";
import { PrismaProductTypeRepository } from "@contexts/price-comparison/infrastructure/prisma-product-type.repository";
import { PrismaStoreRepository } from "@contexts/price-comparison/infrastructure/prisma-store.repository";
import { PricesController } from "@contexts/price-comparison/interface/prices.controller";
import { ProductTypesController } from "@contexts/price-comparison/interface/product-types.controller";
import { StoresController } from "@contexts/price-comparison/interface/stores.controller";
import { Module } from "@nestjs/common";

/** The price comparison context (PFA-275): stores, product types, unit prices per store. */
@Module({
  controllers: [StoresController, ProductTypesController, PricesController],
  providers: [
    StoresService,
    ProductTypesService,
    PricesService,
    SessionAuthGuard,
    { provide: StoreRepository, useClass: PrismaStoreRepository },
    { provide: ProductTypeRepository, useClass: PrismaProductTypeRepository },
    { provide: PriceReadModel, useClass: PrismaPriceReadModel },
  ],
  // Receipt reading recognises stores and links product types through these (PFA-274).
  exports: [StoresService, ProductTypesService],
})
export class PriceComparisonModule {}

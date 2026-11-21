import { GetUserId } from "@contexts/identity/interface/decorators/get-user.decorator";
import { CsrfGuard } from "@contexts/identity/interface/guards/csrf.guard";
import { SessionAuthGuard } from "@contexts/identity/interface/guards/session-auth.guard";
import { StoresService } from "@contexts/price-comparison/application/stores.service";
import { MergeDto } from "@contexts/price-comparison/interface/dto/merge.dto";
import { StoreDto } from "@contexts/price-comparison/interface/dto/store.dto";
import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";

@Controller("stores")
@UseGuards(SessionAuthGuard, CsrfGuard)
export class StoresController {
  constructor(private readonly stores: StoresService) {}

  /** The user's stores, for the store field of the receipt-lines modal (PFA-218). */
  @Get()
  async list(@GetUserId() userID: string) {
    return this.stores.list(userID);
  }

  /** The stores with their purchase counts and likely duplicates, to manage them (PFA-224). */
  @Get("usage")
  async usage(@GetUserId() userID: string) {
    return this.stores.usage(userID);
  }

  @Patch(":storeID")
  async rename(@Param("storeID") storeID: string, @Body() store: StoreDto, @GetUserId() userID: string) {
    return this.stores.rename({ id: storeID, ownerId: userID }, store);
  }

  @Post(":storeID/merge")
  async merge(@Param("storeID") storeID: string, @Body() { targetID }: MergeDto, @GetUserId() userID: string) {
    return this.stores.merge(storeID, targetID, userID);
  }

  @Delete(":storeID")
  async remove(@Param("storeID") storeID: string, @GetUserId() userID: string) {
    return this.stores.remove({ id: storeID, ownerId: userID });
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { StoresService } from "@spendings/stores/stores.service";
import { StoreDto } from "@spendings/stores/dto/store.dto";
import { MergeDto } from "@spendings/catalog/dto/merge.dto";
import { SessionAuthGuard } from "@spendings/guards/session-auth.guard";
import { GetUserId } from "@spendings/decorators/get-user.decorator";
import { CsrfGuard } from "@users/guards/csrf.guard";

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
    return this.stores.rename(storeID, store, userID);
  }

  @Post(":storeID/merge")
  async merge(@Param("storeID") storeID: string, @Body() { targetID }: MergeDto, @GetUserId() userID: string) {
    return this.stores.merge(storeID, targetID, userID);
  }

  @Delete(":storeID")
  async remove(@Param("storeID") storeID: string, @GetUserId() userID: string) {
    return this.stores.remove(storeID, userID);
  }
}

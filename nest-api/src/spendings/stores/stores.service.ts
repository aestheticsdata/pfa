import { randomUUID } from "node:crypto";
import { FIELD_LIMITS } from "@config/field-limits";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { markDuplicates, sameStore } from "@spendings/catalog/catalog-duplicates";
import type { StoreEntry } from "@spendings/catalog/interfaces/catalogTypes";
import type { StoreIdentity, StoreRef } from "@spendings/stores/interfaces/storesTypes";
import { recogniseStore } from "@spendings/stores/store-name";
import { textKey } from "@spendings/text-key";
import { PrismaService } from "../../prisma/prisma.service";

/** The user's stores (PFA-218): one row per shop — name and address (PFA-219). */
@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  list(userID: string): Promise<StoreRef[]> {
    return this.prisma.stores.findMany({
      where: { userID },
      select: { ID: true, name: true, address: true },
      orderBy: [{ name: "asc" }, { address: "asc" }],
    });
  }

  /** A store read on a receipt, as the user's known shop when it is one. */
  async recognise(read: StoreIdentity | null, userID: string): Promise<StoreIdentity | null> {
    if (!read) return null;
    const known = recogniseStore(read, await this.list(userID));
    return known ? { name: known.name, address: known.address } : read;
  }

  /** The store's ID for a name and address the user confirmed, created on first use. */
  async resolve(store: StoreIdentity, userID: string): Promise<string | null> {
    const { name, address, nameKey, addressKey } = storeKeys(store);
    if (!nameKey) return null;
    const saved = await this.prisma.stores.upsert({
      where: { userID_nameKey_addressKey: { userID, nameKey, addressKey } },
      create: { ID: randomUUID(), userID, name, nameKey, address, addressKey },
      update: {},
      select: { ID: true },
    });
    return saved.ID;
  }

  /** The stores with their purchase counts and likely duplicates (PFA-224). */
  async usage(userID: string): Promise<StoreEntry[]> {
    const stores = await this.prisma.stores.findMany({
      where: { userID },
      select: { ID: true, name: true, address: true, _count: { select: { spendings: true } } },
      orderBy: [{ name: "asc" }, { address: "asc" }],
    });
    const entries = stores.map(({ _count, ...store }) => ({ ...store, uses: _count.spendings, duplicateOf: null }));
    return markDuplicates(entries, sameStore);
  }

  /** A new name or address; refused when another store already bears both — merge it instead. */
  async rename(storeID: string, store: StoreIdentity, userID: string): Promise<StoreRef> {
    await this.owned(storeID, userID);
    const { name, address, nameKey, addressKey } = storeKeys(store);
    if (!nameKey) throw new BadRequestException("Store name is empty");
    const twin = await this.prisma.stores.findFirst({
      where: { userID, nameKey, addressKey, ID: { not: storeID } },
      select: { ID: true },
    });
    if (twin) throw new ConflictException({ message: "Store already exists", conflictID: twin.ID });
    return this.prisma.stores.update({
      where: { ID: storeID },
      data: { name, nameKey, address, addressKey },
      select: { ID: true, name: true, address: true },
    });
  }

  /** The source's spendings move to the target, then the source goes, all at once. */
  async merge(sourceID: string, targetID: string, userID: string): Promise<void> {
    if (sourceID === targetID) throw new BadRequestException("A store cannot merge into itself");
    await Promise.all([this.owned(sourceID, userID), this.owned(targetID, userID)]);
    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({ where: { storeID: sourceID, userID }, data: { storeID: targetID } }),
      this.prisma.stores.delete({ where: { ID: sourceID } }),
    ]);
  }

  /** Only a store no spending was bought at. */
  async remove(storeID: string, userID: string): Promise<void> {
    await this.owned(storeID, userID);
    if (await this.prisma.spendings.count({ where: { storeID } })) {
      throw new ConflictException("Store is in use");
    }
    await this.prisma.stores.delete({ where: { ID: storeID } });
  }

  private async owned(storeID: string, userID: string): Promise<void> {
    const store = await this.prisma.stores.findFirst({ where: { ID: storeID, userID }, select: { ID: true } });
    if (!store) throw new NotFoundException("Store not found");
  }
}

/** A store's name and address trimmed to their columns, and their keys. */
function storeKeys(store: StoreIdentity) {
  const name = store.name.trim().slice(0, FIELD_LIMITS.storeName);
  const address = store.address?.trim().slice(0, FIELD_LIMITS.storeAddress) || null;
  return { name, address, nameKey: textKey(name), addressKey: textKey(address ?? "") };
}

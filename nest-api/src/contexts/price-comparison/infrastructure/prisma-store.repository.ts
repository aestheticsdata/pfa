import { randomUUID } from "node:crypto";
import type {
  CatalogMerge,
  OwnedEntry,
  StoreKeys,
  StoreRef,
  StoreUsage,
} from "@contexts/price-comparison/domain/interfaces/priceComparisonTypes";
import { StoreRepository } from "@contexts/price-comparison/domain/ports/store.repository";
import { PrismaService } from "@db/prisma.service";
import { Injectable } from "@nestjs/common";

const STORE_REF = { ID: true, name: true, address: true } as const;

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  list(ownerId: string): Promise<StoreRef[]> {
    return this.prisma.stores.findMany({
      where: { userID: ownerId },
      select: STORE_REF,
      orderBy: [{ name: "asc" }, { address: "asc" }],
    });
  }

  async usage(ownerId: string): Promise<StoreUsage[]> {
    const stores = await this.prisma.stores.findMany({
      where: { userID: ownerId },
      select: { ...STORE_REF, _count: { select: { spendings: true } } },
      orderBy: [{ name: "asc" }, { address: "asc" }],
    });
    return stores.map(({ _count, ...store }) => ({ ...store, uses: _count.spendings }));
  }

  async exists(store: OwnedEntry): Promise<boolean> {
    const row = await this.prisma.stores.findFirst({
      where: { ID: store.id, userID: store.ownerId },
      select: { ID: true },
    });
    return row !== null;
  }

  async twin(keys: StoreKeys, store: OwnedEntry): Promise<string | null> {
    const row = await this.prisma.stores.findFirst({
      where: { userID: store.ownerId, nameKey: keys.nameKey, addressKey: keys.addressKey, ID: { not: store.id } },
      select: { ID: true },
    });
    return row?.ID ?? null;
  }

  async upsert(keys: StoreKeys, ownerId: string): Promise<string> {
    const { nameKey, addressKey } = keys;
    const saved = await this.prisma.stores.upsert({
      where: { userID_nameKey_addressKey: { userID: ownerId, nameKey, addressKey } },
      create: { ID: randomUUID(), userID: ownerId, ...keys },
      update: {},
      select: { ID: true },
    });
    return saved.ID;
  }

  rename(storeId: string, keys: StoreKeys): Promise<StoreRef> {
    return this.prisma.stores.update({ where: { ID: storeId }, data: keys, select: STORE_REF });
  }

  async merge(merge: CatalogMerge): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.spendings.updateMany({
        where: { storeID: merge.sourceId, userID: merge.ownerId },
        data: { storeID: merge.targetId },
      }),
      this.prisma.stores.delete({ where: { ID: merge.sourceId } }),
    ]);
  }

  purchases(storeId: string): Promise<number> {
    return this.prisma.spendings.count({ where: { storeID: storeId } });
  }

  async remove(storeId: string): Promise<void> {
    await this.prisma.stores.delete({ where: { ID: storeId } });
  }
}

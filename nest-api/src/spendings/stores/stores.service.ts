import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { FIELD_LIMITS } from "@config/field-limits";
import { closestStore, storeKey } from "@spendings/stores/store-name";
import type { StoreRef } from "@spendings/stores/interfaces/storesTypes";
import { PrismaService } from "../../prisma/prisma.service";

/** The user's stores (PFA-218): one row per shop, whatever the receipts' spelling. */
@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  list(userID: string): Promise<StoreRef[]> {
    return this.prisma.stores.findMany({
      where: { userID },
      select: { ID: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  /** A name read on a receipt, as the user's store it resembles when there is one. */
  async recognise(name: string | null, userID: string): Promise<string | null> {
    if (!name) return null;
    return closestStore(name, await this.list(userID))?.name ?? name;
  }

  /** The store's ID for a name the user confirmed, created on first use. */
  async resolve(name: string, userID: string): Promise<string | null> {
    const trimmed = name.trim().slice(0, FIELD_LIMITS.storeName);
    const nameKey = storeKey(trimmed);
    if (!nameKey) return null;
    const store = await this.prisma.stores.upsert({
      where: { userID_nameKey: { userID, nameKey } },
      create: { ID: randomUUID(), userID, name: trimmed, nameKey },
      update: {},
      select: { ID: true },
    });
    return store.ID;
  }
}

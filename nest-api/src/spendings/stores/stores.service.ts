import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { FIELD_LIMITS } from "@config/field-limits";
import { recogniseStore } from "@spendings/stores/store-name";
import { textKey } from "@spendings/text-key";
import type { StoreIdentity, StoreRef } from "@spendings/stores/interfaces/storesTypes";
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
    const name = store.name.trim().slice(0, FIELD_LIMITS.storeName);
    const address = store.address?.trim().slice(0, FIELD_LIMITS.storeAddress) || null;
    const nameKey = textKey(name);
    if (!nameKey) return null;
    const addressKey = textKey(address ?? "");
    const saved = await this.prisma.stores.upsert({
      where: { userID_nameKey_addressKey: { userID, nameKey, addressKey } },
      create: { ID: randomUUID(), userID, name, nameKey, address, addressKey },
      update: {},
      select: { ID: true },
    });
    return saved.ID;
  }
}

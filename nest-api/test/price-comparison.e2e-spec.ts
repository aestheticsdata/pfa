import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createAuthenticatedSession } from "./auth-session.helper";
import { defined } from "./defined.helper";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

interface Entry {
  ID: string;
  name: string;
  address?: string | null;
  uses: number;
  duplicateOf: string | null;
}

/**
 * Stores, product types and prices end to end (PFA-275): behind ports now, pinned here against
 * MySQL — the 409 body that names the twin to merge into included.
 */
describe("Price comparison (e2e)", () => {
  let app: INestApplication;
  let agent: Agent;
  const tag = `E2E PC ${Date.now()}`;
  const spendingIds: string[] = [];

  /** A spending bought at `store`, its receipt lines typed. */
  const buy = async (store: string, lines: { productType: string; amount: number; size: number }[]) => {
    const created = await agent
      .post("/api/spendings")
      .send({ date: "2018-03-03", label: `${tag} buy`, amount: 1, currency: "EUR" })
      .expect(201);
    spendingIds.push(created.body.ID);
    await agent
      .put(`/api/spendings/${created.body.ID}/lines`)
      .send({
        store: { name: store, address: null },
        lines: lines.map((line) => ({ label: line.productType, quantity: 1, sizeUnit: "g", ...line })),
      })
      .expect(200);
  };

  const storeNamed = async (name: string) => {
    const res = await agent.get("/api/stores/usage").expect(200);
    return defined(
      (res.body as Entry[]).find((store) => store.name === name),
      name,
    );
  };

  beforeAll(async () => {
    app = await createE2eApp();
    agent = (await createAuthenticatedSession(app.getHttpServer() as SupertestApp)).agent;
    await buy(`${tag} North`, [{ productType: `${tag} Rice`, amount: 2, size: 1000 }]);
    await buy(`${tag} South`, [{ productType: `${tag} Rice`, amount: 1.5, size: 500 }]);
  }, 20000);

  afterAll(async () => {
    for (const id of spendingIds) await agent.delete(`/api/spendings/${id}`);
    await app.close();
  });

  it("ranks the stores of a product type per kilo, the cheapest flagged", async () => {
    const summary = await agent.get("/api/prices").expect(200);
    const rice = defined(
      (summary.body as { ID: string; name: string; stores: number }[]).find((type) => type.name === `${tag} Rice`),
      "the rice summary",
    );
    expect(rice.stores).toBe(2);

    const comparison = await agent.get(`/api/prices/${rice.ID}`).expect(200);
    const [perKilo] = comparison.body.comparisons;
    expect(perKilo.basis).toBe("kg");
    expect(
      perKilo.stores.map((store: { name: string; lastUnitPrice: number; cheapest: boolean }) => [
        store.name,
        store.lastUnitPrice,
        store.cheapest,
      ]),
    ).toEqual([
      [`${tag} North`, 2, true],
      [`${tag} South`, 3, false],
    ]);
  });

  it("refuses a rename onto another store with a 409 naming it", async () => {
    const [north, south] = [await storeNamed(`${tag} North`), await storeNamed(`${tag} South`)];

    await agent
      .patch(`/api/stores/${north.ID}`)
      .send({ name: `${tag} south.`, address: null })
      .expect(409)
      .expect({ message: "Store already exists", conflictID: south.ID });
  });

  it("refuses to delete a store in use, merges it, then answers 404 for it", async () => {
    const [north, south] = [await storeNamed(`${tag} North`), await storeNamed(`${tag} South`)];

    await agent
      .delete(`/api/stores/${north.ID}`)
      .expect(409)
      .expect((res) => expect(res.body.message).toBe("Store is in use"));
    await agent.post(`/api/stores/${north.ID}/merge`).send({ targetID: south.ID }).expect(201);

    expect((await storeNamed(`${tag} South`)).uses).toBe(2);
    await agent.delete(`/api/stores/${north.ID}`).expect(404);
  });

  it("renames a product type, refusing an empty name", async () => {
    const types = (await agent.get("/api/product-types/usage").expect(200)).body as Entry[];
    const rice = defined(
      types.find((type) => type.name === `${tag} Rice`),
      "the rice type",
    );

    await agent
      .patch(`/api/product-types/${rice.ID}`)
      .send({ name: " .. " })
      .expect(400)
      .expect((res) => expect(res.body.message).toBe("Product type name is empty"));
    await agent
      .patch(`/api/product-types/${rice.ID}`)
      .send({ name: `${tag} Basmati` })
      .expect(200)
      .expect({ ID: rice.ID, name: `${tag} Basmati` });
  });
});

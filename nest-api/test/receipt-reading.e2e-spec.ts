import { existsSync } from "node:fs";
import { join } from "node:path";
import { env } from "@config/env";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createAuthenticatedSession } from "./auth-session.helper";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

interface Row {
  ID: string;
  label: string;
  invoicefile: string | null;
  storeName: string | null;
  lineCount: number;
}

const FIXTURE_IMAGE = join(__dirname, "fixtures", "galaxy.jpg");

/**
 * The receipt routes end to end (PFA-274): files, saved lines and the bulk read now sit behind
 * ports. This pins what a client sees against MySQL and the disk. The OCR itself is not run here:
 * its adapter is Tesseract, slow and covered by the parser's unit tests.
 */
describe("Receipt reading (e2e)", () => {
  let app: INestApplication;
  let agent: Agent;
  let userId: string;
  const day = "2018-06-15";
  const tag = `e2e-receipts-${Date.now()}`;

  const record = async (suffix: string) => {
    const res = await agent
      .post("/api/spendings")
      .send({ date: day, label: `${tag}-${suffix}`, amount: 3, currency: "EUR" })
      .expect(201);
    return res.body.ID as string;
  };

  const rowsOfDay = async () => {
    const res = await agent.get("/api/spendings").query({ from: day, to: day }).expect(200);
    return (res.body as Row[]).filter((row) => row.label.startsWith(tag));
  };

  beforeAll(async () => {
    app = await createE2eApp();
    const session = await createAuthenticatedSession(app.getHttpServer() as SupertestApp);
    agent = session.agent;
    userId = session.userId;
  });

  afterAll(async () => {
    for (const row of await rowsOfDay()) await agent.delete(`/api/spendings/${row.ID}`);
    await app.close();
  });

  it("shares one upload between spendings, then detaches one of them", async () => {
    const [a, b] = [await record("a"), await record("b")];

    const shared = await agent
      .post("/api/spendings/receipts")
      .field("spendingIDs", JSON.stringify([a, b]))
      .field("itemType", "spending")
      .field("date", day)
      .field("label", tag)
      .attach("invoiceImageUpload", FIXTURE_IMAGE)
      .expect(201);
    const file = shared.body.invoicefile as string;
    expect(file).toMatch(/-r\.jpg$/);

    await agent
      .post("/api/spendings/receipts/detach")
      .send({ spendingIDs: [a] })
      .expect(201);

    const rows = await rowsOfDay();
    expect(rows.find((row) => row.ID === a)?.invoicefile).toBeNull();
    expect(rows.find((row) => row.ID === b)?.invoicefile).toBe(file);
    // The file is still held by b: it is still served.
    const image = await agent.get(`/api/spendings/upload/${b}`).query({ itemType: "spending" }).expect(200);
    const body = image.text ?? (Buffer.isBuffer(image.body) ? image.body.toString() : String(image.body));
    expect(body).toMatch(/^data:image\/\w+;base64,/);
  }, 20000);

  it("lets a receipt file go once its last spending is deleted, through the Spending events (PFA-278)", async () => {
    const [a, b] = [await record("evt-a"), await record("evt-b")];
    const shared = await agent
      .post("/api/spendings/receipts")
      .field("spendingIDs", JSON.stringify([a, b]))
      .field("itemType", "spending")
      .field("date", day)
      .field("label", tag)
      .attach("invoiceImageUpload", FIXTURE_IMAGE)
      .expect(201);
    const file = join(env.invoicesPath, userId, shared.body.invoicefile as string);
    expect(existsSync(file)).toBe(true);

    await agent.delete(`/api/spendings/${a}`).expect(200);
    expect(existsSync(file)).toBe(true);

    await agent.delete(`/api/spendings/${b}`).expect(200);
    expect(existsSync(file)).toBe(false);
  }, 20000);

  it("refuses to share onto a spending that is not the user's", async () => {
    await agent
      .post("/api/spendings/receipts")
      .field("spendingIDs", JSON.stringify(["not-a-spending"]))
      .field("itemType", "spending")
      .field("date", day)
      .field("label", tag)
      .attach("invoiceImageUpload", FIXTURE_IMAGE)
      .expect(404)
      .expect((res) => expect(res.body.message).toBe("Spending not found"));
  });

  it("saves a receipt's lines as a set and reads them back, store included", async () => {
    const id = await record("lines");
    const store = { name: `${tag} Market`, address: null };

    const saved = await agent
      .put(`/api/spendings/${id}/lines`)
      .send({
        lines: [
          { label: " BREAD ", amount: 1.2, quantity: 2, size: null, sizeUnit: null, productType: null },
          { label: "SOAP", amount: 3.5, quantity: 1, size: 250, sizeUnit: "ml", productType: null },
        ],
        store,
      })
      .expect(200);

    expect(saved.body.lines.map((line: { label: string }) => line.label)).toEqual(["BREAD", "SOAP"]);
    expect(saved.body.store).toMatchObject({ name: store.name });
    await agent
      .get(`/api/spendings/${id}/lines`)
      .expect(200)
      .expect((res) => expect(res.body).toEqual(saved.body));
    expect((await rowsOfDay()).find((row) => row.ID === id)).toMatchObject({ storeName: store.name, lineCount: 2 });

    await agent.put(`/api/spendings/${id}/lines`).send({ lines: [], store: null }).expect(200);
  });

  it("answers 404 for the lines of a spending that is not the user's, and 400 with nothing to read", async () => {
    await agent.get("/api/spendings/not-a-spending/lines").expect(404);
    const id = await record("no-receipt");
    await agent
      .post(`/api/spendings/${id}/lines/ocr`)
      .expect(400)
      .expect((res) => expect(res.body.message).toBe("NO_RECEIPT"));
  });

  it("reports the bulk read's progress", () => {
    return agent
      .get("/api/receipt-proposals")
      .expect(200)
      .expect((res) =>
        expect(res.body).toEqual({
          candidates: expect.any(Number),
          queued: expect.any(Number),
          ready: expect.any(Number),
          failed: expect.any(Number),
        }),
      );
  });
});

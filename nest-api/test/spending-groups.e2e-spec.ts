import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createAuthenticatedSession } from "./auth-session.helper";
import { defined } from "./defined.helper";
import { createE2eApp } from "./e2e-app";

type SupertestApp = Parameters<typeof request>[0];
type Agent = ReturnType<typeof request.agent>;

interface Row {
  ID: string;
  label: string;
  amount: string;
  detail: string | null;
  groupID: string | null;
  groupLabel: string | null;
  currency: string | null;
}

/**
 * The group routes end to end (PFA-273): the rules moved into the SpendingGroup aggregate, and
 * this pins what a client sees — same payloads, same statuses, same messages — against MySQL.
 */
describe("SpendingGroupsController (e2e)", () => {
  let app: INestApplication;
  let agent: Agent;
  // A day of its own, far from the other suites' rows.
  const day = `2019-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`;
  const tag = `e2e-groups-${Date.now()}`;

  const rowsOfDay = async () => {
    const res = await agent.get("/api/spendings").query({ from: day, to: day }).expect(200);
    return (res.body as Row[]).filter((row) => row.label.startsWith(tag));
  };

  const createGroup = async (lines: { detail?: string; amount: number }[]) => {
    const res = await agent.post("/api/spendings/groups").send({ date: day, label: tag, currency: "EUR", lines });
    expect(res.status).toBe(201);
    return res.body as { ID: string; spendingIDs: string[] };
  };

  beforeAll(async () => {
    app = await createE2eApp();
    agent = (await createAuthenticatedSession(app.getHttpServer() as SupertestApp)).agent;
  });

  afterAll(async () => {
    for (const row of await rowsOfDay()) {
      await agent.delete(`/api/spendings/${row.ID}`);
    }
    await app.close();
  });

  it("creates a group whose lines carry the composed label", async () => {
    const created = await createGroup([{ detail: " Fruit ", amount: 4.5 }, { amount: 6 }]);

    expect(created.spendingIDs).toHaveLength(2);
    const rows = await rowsOfDay();
    const fruit = defined(
      rows.find((row) => row.ID === created.spendingIDs[0]),
      "the first line",
    );
    expect(fruit).toMatchObject({ label: `${tag} — Fruit`, detail: "Fruit", groupID: created.ID, groupLabel: tag });
    expect(fruit.amount).toBe("4.5");
    expect(rows.find((row) => row.ID === created.spendingIDs[1])?.label).toBe(tag);

    await agent.delete(`/api/spendings/groups/${created.ID}`).expect(200);
  });

  it("edits a group: renames, adds a line in its currency, removes the lines left out", async () => {
    const created = await createGroup([
      { detail: "A", amount: 1 },
      { detail: "B", amount: 2 },
    ]);

    await agent
      .put(`/api/spendings/groups/${created.ID}`)
      .send({
        label: `${tag}-renamed`,
        lines: [
          { ID: created.spendingIDs[0], detail: "A", amount: 3 },
          { detail: "C", amount: 4 },
        ],
      })
      .expect(200)
      .expect({ success: true });

    const rows = (await rowsOfDay()).filter((row) => row.groupID === created.ID);
    expect(rows.map((row) => row.label).sort()).toEqual([`${tag}-renamed — A`, `${tag}-renamed — C`]);
    expect(rows.every((row) => row.currency === "EUR")).toBe(true);
    expect(rows.find((row) => row.ID === created.spendingIDs[1])).toBeUndefined();

    await agent.delete(`/api/spendings/groups/${created.ID}`).expect(200);
  });

  it("refuses an edit naming a line of another group", async () => {
    const created = await createGroup([{ amount: 1 }]);

    await agent
      .put(`/api/spendings/groups/${created.ID}`)
      .send({ label: tag, lines: [{ ID: "not-a-line", amount: 1 }] })
      .expect(400)
      .expect((res) => expect(res.body.message).toBe("Line does not belong to the group"));

    await agent.delete(`/api/spendings/groups/${created.ID}`).expect(200);
  });

  it("merges spendings into a new group and drops the group they left", async () => {
    const first = await createGroup([
      { detail: "X", amount: 1 },
      { detail: "Y", amount: 2 },
    ]);

    const merged = await agent
      .post("/api/spendings/groups/merge")
      .send({ label: `${tag}-merged`, lines: first.spendingIDs.map((spendingID) => ({ spendingID, detail: "Z" })) })
      .expect(201);

    const rows = (await rowsOfDay()).filter((row) => first.spendingIDs.includes(row.ID));
    expect(rows.every((row) => row.groupID === merged.body.ID && row.label === `${tag}-merged — Z`)).toBe(true);
    await agent
      .put(`/api/spendings/groups/${first.ID}`)
      .send({ label: tag, lines: [{ amount: 1 }] })
      .expect(404);

    await agent
      .post(`/api/spendings/groups/${merged.body.ID}/ungroup`)
      .expect(201)
      .expect((res) => expect([...res.body.spendingIDs].sort()).toEqual([...first.spendingIDs].sort()));
    expect((await rowsOfDay()).filter((row) => row.groupID !== null)).toEqual([]);
  });

  it("refuses to merge a spending twice, or one of another day", async () => {
    const created = await createGroup([{ amount: 1 }]);
    const other = await agent
      .post("/api/spendings")
      .send({ date: "2018-01-01", label: `${tag}-other-day`, amount: 1, currency: "EUR" })
      .expect(201);

    await agent
      .post("/api/spendings/groups/merge")
      .send({ label: tag, lines: [{ spendingID: created.spendingIDs[0] }, { spendingID: created.spendingIDs[0] }] })
      .expect(400)
      .expect((res) => expect(res.body.message).toBe("Duplicate spending"));
    await agent
      .post("/api/spendings/groups/merge")
      .send({ label: tag, lines: [{ spendingID: created.spendingIDs[0] }, { spendingID: other.body.ID }] })
      .expect(400)
      .expect((res) => expect(res.body.message).toBe("A group spans a single day"));

    await agent.delete(`/api/spendings/${other.body.ID}`).expect(200);
    await agent.delete(`/api/spendings/groups/${created.ID}`).expect(200);
  });

  it("answers 404 for a group that is not the user's", () => {
    return agent
      .delete("/api/spendings/groups/not-a-group")
      .expect(404)
      .expect((res) => expect(res.body).toEqual({ statusCode: 404, message: "Group not found", error: "Not Found" }));
  });

  it("deletes a spending, and its group with it when it was the last line", async () => {
    const created = await createGroup([{ amount: 1 }]);

    await agent.delete(`/api/spendings/${created.spendingIDs[0]}`).expect(200).expect({ success: true });

    await agent.delete(`/api/spendings/groups/${created.ID}`).expect(404);
  });
});

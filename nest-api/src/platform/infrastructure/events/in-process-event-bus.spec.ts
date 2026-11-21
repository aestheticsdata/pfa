import { InProcessEventBus } from "@infrastructure/events/in-process-event-bus";
import type { DomainEvent } from "@shared-kernel/interfaces/sharedKernelTypes";

describe("InProcessEventBus", () => {
  const event = (name: string): DomainEvent => ({ name, ownerId: "u1" });

  it("hands each event to its handlers, in order, and awaits them", async () => {
    const bus = new InProcessEventBus();
    const seen: string[] = [];
    bus.subscribe(["a", "b"], async (e) => {
      await Promise.resolve();
      seen.push(`first:${e.name}`);
    });
    bus.subscribe(["a"], async (e) => {
      seen.push(`second:${e.name}`);
    });

    await bus.publish([event("a"), event("b"), event("nobody")]);

    expect(seen).toEqual(["first:a", "second:a", "first:b"]);
  });

  it("lets a failing handler fail the publish, as the direct call it replaces did", async () => {
    const bus = new InProcessEventBus();
    bus.subscribe(["a"], async () => {
      throw new Error("disk full");
    });

    await expect(bus.publish([event("a")])).rejects.toThrow("disk full");
  });
});

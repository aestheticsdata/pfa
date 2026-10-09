import { createSpendingsPageStore } from "@components/spendings/stores/spendingsPageStore";

const MON = "2026-05-04";
const TUE = "2026-05-05";

describe("spendingsPageStore selection", () => {
  it("ticks rows across several cards", () => {
    const store = createSpendingsPageStore();
    const { toggleDaySelection, toggleEntry } = store.getState();

    toggleDaySelection(MON);
    toggleDaySelection(TUE);
    toggleEntry("a", MON);
    toggleEntry("b", TUE);

    expect(store.getState().selected).toEqual({ a: MON, b: TUE });
  });

  it("leaving one card's selection unticks only its rows", () => {
    const store = createSpendingsPageStore();
    const { toggleDaySelection, toggleEntry } = store.getState();
    toggleDaySelection(MON);
    toggleDaySelection(TUE);
    toggleEntry("a", MON);
    toggleEntry("b", TUE);

    toggleDaySelection(MON);

    expect(store.getState().selectingDays).toEqual([TUE]);
    expect(store.getState().selected).toEqual({ b: TUE });
  });

  it("a second tick unticks, and exit clears everything", () => {
    const store = createSpendingsPageStore();
    const { toggleDaySelection, toggleEntry, exitSelection } = store.getState();
    toggleDaySelection(MON);
    toggleEntry("a", MON);
    toggleEntry("a", MON);
    expect(store.getState().selected).toEqual({});

    toggleEntry("a", MON);
    exitSelection();
    expect(store.getState()).toMatchObject({ selectingDays: [], selected: {} });
  });
});

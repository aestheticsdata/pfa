import { render, screen } from "@testing-library/react-native";
import { Amount } from "@ui/Amount";

/** fr-FR uses a narrow no-break space to group thousands; tests read it as a plain space. */
const plain = (text: string) => text.replace(/[  ]/g, " ");

describe("<Amount>", () => {
  it("draws euros from integer cents, fr-FR grouping, decimals apart", async () => {
    await render(<Amount cents={157_718} />);
    const amount = screen.getByLabelText("1 577,18 euros");
    expect(plain(screen.getByText(/577/).props.children[0])).toBe("1 577");
    expect(amount).toBeOnTheScreen();
  });

  it("reads a negative amount in full", async () => {
    await render(<Amount cents={-1_250} />);
    expect(screen.getByLabelText("moins 12,50 euros")).toBeOnTheScreen();
  });

  it("says a whole amount without its zero decimals", async () => {
    await render(<Amount cents={42_000} />);
    expect(screen.getByLabelText(/^420 euros$/)).toBeOnTheScreen();
  });

  it("shows « • ••• •• » and never the figure while masked", async () => {
    await render(
      <Amount
        cents={157_718}
        masked
      />,
    );
    expect(screen.getByText("• ••• ••")).toBeOnTheScreen();
    expect(screen.queryByText(/577/)).toBeNull();
  });
});

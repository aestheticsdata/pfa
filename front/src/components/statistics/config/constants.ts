// A KPI breakdown row: the exceptional or the regular share of a total.
export const KPI_ROW_KIND = { exc: "exc", reg: "reg" } as const;

// How a KPI row's title reads: a month heading, or an expense's own label.
export const KPI_TITLE_VARIANT = { month: "month", expense: "expense" } as const;

// Which part of a KPI row the cursor tooltip is describing.
export const KPI_ROW_HOVER = { title: "title", bar: "bar" } as const;

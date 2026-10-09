// Column template shared by the editor's header and its rows (PFA-189):
// category 150px · detail · amount 210px · remove 30px. The amount is wide on
// purpose — it takes a sum typed off the receipt ("12+3,5+7,5"). On phones the
// detail takes its own full-width row above: category 120px · amount · remove.
export const GROUP_LINE_GRID =
  "grid grid-cols-[9.375rem_minmax(0,1fr)_13.125rem_1.875rem] gap-2 max-md:grid-cols-[7.5rem_minmax(0,1fr)_1.875rem]";
